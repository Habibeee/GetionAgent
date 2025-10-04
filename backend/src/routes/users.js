import { Router } from 'express';
import User from '../models/User.js';
import Account from '../models/Account.js';
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import Agent from '../models/Agent.js';

const router = Router();

// GET /users -> { data: [...] }
router.get('/', requireAuth, async (_req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    const emails = users.map(u => u.email);
    const accounts = await Account.find({ ownerEmail: { $in: emails } });
    const accByEmail = new Map(accounts.map(a => [a.ownerEmail, a]));

    // Ensure distributeurs have an account
    for (const u of users) {
      if ((u.type || 'client') === 'distributeur') {
        const exists = accByEmail.get(u.email);
        if (!exists) {
          const accountNumber = `ACCT-${u.email}`;
          const created = await Account.create({ accountNumber, ownerEmail: u.email, balance: 0 });
          accByEmail.set(u.email, created);
        }
      }
    }

    const data = users.map(u => {
      const acc = accByEmail.get(u.email);
      const obj = u.toObject();
      return { ...obj, accountNumber: acc ? acc.accountNumber : undefined };
    });

    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /users/stats -> { total, clients, distributeurs, agents }
router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const clientsFilter = {
      $or: [
        { type: { $exists: false } },
        { type: null },
        { type: '' },
        { type: { $regex: /^client$/i } },
      ],
    };
    const distributeursFilter = { type: { $regex: /^distributeur$/i } };

    const [total, clients, distributeurs, agents] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments(clientsFilter),
      User.countDocuments(distributeursFilter),
      Agent.countDocuments({}),
    ]);
    res.json({ total, clients, distributeurs, agents });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /users  (admin create)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nom, prenom, telephone, dateNaissance, numeroIdentite, email, password, photo, accountNumber } = req.body || {};
    let { type } = req.body || {};
    if (!nom || !prenom || !telephone || !dateNaissance || !numeroIdentite || !email || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Validate birth date: must be <= 2020-12-31
    const MAX_BIRTH = new Date('2020-12-31');
    const parsed = new Date(dateNaissance);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Format de date de naissance invalide' });
    }
    if (parsed.getTime() > MAX_BIRTH.getTime()) {
      return res.status(400).json({ error: 'La date de naissance ne doit pas être postérieure à 2020-12-31' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    // sanitize type
    type = typeof type === 'string' ? String(type).toLowerCase() : 'client';
    if (!['client', 'distributeur'].includes(type)) type = 'client';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      nom,
      prenom,
      telephone,
      dateNaissance,
      numeroIdentite,
      email: String(email).toLowerCase(),
      passwordHash,
      photo: photo || '',
      type,
    });

    // Create an associated account only for distributeur (if not exists)
    if (type === 'distributeur') {
      const desiredAcc = accountNumber ? String(accountNumber) : `ACCT-${user.email}`;
      const existsAccount = await Account.findOne({ accountNumber: desiredAcc });
      if (existsAccount) {
        if (accountNumber) {
          return res.status(409).json({ error: 'Numéro de compte déjà utilisé' });
        }
      } else {
        await Account.create({ accountNumber: desiredAcc, ownerEmail: user.email, balance: 0 });
      }
    }

    const { passwordHash: _ph, ...safeUser } = user.toObject();
    return res.status(201).json({ message: 'Utilisateur créé', user: safeUser });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /users/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  // Optionally also delete accounts; we keep them for history, so skip for now
  res.json({ message: 'Utilisateur supprimé' });
});

// PATCH /users/block/:id  body: { action: 'block' | 'unblock' }
router.patch('/block/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body || {};
  if (!['block', 'unblock'].includes(action)) return res.status(400).json({ error: 'Action invalide' });
  const actif = action === 'unblock';
  const user = await User.findByIdAndUpdate(id, { actif }, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ message: 'Statut mis à jour', user });
});

// PATCH /users/:id -> update editable fields
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['nom', 'prenom', 'telephone', 'dateNaissance', 'numeroIdentite', 'email', 'photo', 'type'];
    const updates = {};
    for (const k of allowed) if (req.body?.[k] !== undefined) updates[k] = req.body[k];

    // Validate date if provided
    if (updates.dateNaissance) {
      const MAX_BIRTH = new Date('2020-12-31');
      const parsed = new Date(updates.dateNaissance);
      if (isNaN(parsed.getTime())) return res.status(400).json({ error: 'Format de date de naissance invalide' });
      if (parsed.getTime() > MAX_BIRTH.getTime()) return res.status(400).json({ error: 'La date de naissance ne doit pas être postérieure à 2020-12-31' });
    }

    // Validate type if provided
    if (updates.type && !['client', 'distributeur'].includes(String(updates.type).toLowerCase())) {
      return res.status(400).json({ error: 'Type invalide' });
    }
    if (updates.type) updates.type = String(updates.type).toLowerCase();

    // Handle email uniqueness if provided
    if (updates.email) {
      updates.email = String(updates.email).toLowerCase();
      const exists = await User.findOne({ email: updates.email, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur modifié', user });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /users/bulk-delete  body: { ids: string[] }
router.post('/bulk-delete', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ error: 'Liste d\'identifiants requise' });
    const result = await User.deleteMany({ _id: { $in: ids } });
    // Option: also delete related accounts; skipped for history
    res.json({ message: 'Utilisateurs supprimés', deletedCount: result?.deletedCount || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /users/bulk-block  body: { ids: string[], action: 'block' | 'unblock' }
router.post('/bulk-block', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const { action } = req.body || {};
    if (!ids.length) return res.status(400).json({ error: 'Liste d\'identifiants requise' });
    if (!['block', 'unblock'].includes(action)) return res.status(400).json({ error: 'Action invalide' });
    const actif = action === 'unblock';
    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { actif } });
    res.json({ message: 'Statut mis à jour', matchedCount: result?.matchedCount || 0, modifiedCount: result?.modifiedCount || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
