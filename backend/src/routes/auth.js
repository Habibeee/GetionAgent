import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { sign } from '../middleware/auth.js';
import User from '../models/User.js';
import Account from '../models/Account.js';

const router = Router();

router.post('/register', async (req, res) => {
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
    const existing = await User.findOne({ email: email.toLowerCase() });
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
      email: email.toLowerCase(),
      passwordHash,
      photo: photo || '',
      type,
    });

    // Create associated account only for distributeur
    if (type === 'distributeur') {
      const desiredAcc = accountNumber ? String(accountNumber) : `ACCT-${user.email}`;
      const existsAccount = await Account.findOne({ accountNumber: desiredAcc });
      if (existsAccount) {
        // If user requested a specific number and it's taken, report error
        if (accountNumber) {
          return res.status(409).json({ error: 'Numéro de compte déjà utilisé' });
        }
      } else {
        await Account.create({ accountNumber: desiredAcc, ownerEmail: user.email, balance: 0 });
      }
    }

    // Return created user (without passwordHash) so frontend can display it
    const { passwordHash: _ph, ...safeUser } = user.toObject();
    return res.status(201).json({ message: 'Inscription réussie', user: safeUser });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
    const token = sign({ sub: user._id.toString(), email: user.email, nom: user.nom, prenom: user.prenom });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
