import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

const router = Router();

const MIN_AMOUNT = 500;
const MAX_AMOUNT = 500000;

router.post('/deposit', requireAuth, async (req, res) => {
  try {
    const { accountNumber, amount } = req.body || {};
    const amt = Number(amount);
    if (!accountNumber || !Number.isFinite(amt)) {
      return res.status(400).json({ error: 'Paramètres invalides' });
    }
    if (amt < MIN_AMOUNT || amt > MAX_AMOUNT) {
      return res.status(400).json({ error: `Le montant doit être entre ${MIN_AMOUNT} et ${MAX_AMOUNT} FCFA.` });
    }

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    account.balance += amt;
    await account.save();

    const fullName = `${req.user?.nom || ''} ${req.user?.prenom || ''}`.trim();
    const tx = await Transaction.create({
      type: 'deposit',
      accountNumber,
      amount: amt,
      by: req.user?.email || 'unknown',
      byName: fullName,
      date: new Date(),
    });

    return res.status(201).json({ message: 'Dépôt effectué', balance: account.balance, transaction: tx });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/account/:accountNumber', requireAuth, async (req, res) => {
  const { accountNumber } = req.params;
  const account = await Account.findOne({ accountNumber });
  if (!account) return res.status(404).json({ error: 'Compte introuvable' });
  const history = await Transaction.find({ accountNumber }).sort({ createdAt: -1 });
  return res.json({ account, history });
});

// GET /transactions -> list all transactions (latest first)
router.get('/', requireAuth, async (_req, res) => {
  try {
    const list = await Transaction.find().sort({ createdAt: -1 });
    return res.json({ data: list });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /transactions/cancel -> { id }
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Identifiant requis' });
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ error: 'Transaction introuvable' });
    if (tx.status === 'canceled') return res.status(400).json({ error: 'Transaction déjà annulée' });

    // Revert effects for deposit
    if (tx.type === 'deposit') {
      const acc = await Account.findOne({ accountNumber: tx.accountNumber });
      if (!acc) return res.status(404).json({ error: 'Compte introuvable' });
      const newBal = Number((acc.balance || 0) - (tx.amount || 0));
      acc.balance = newBal < 0 ? 0 : newBal;
      await acc.save();
    }

    tx.status = 'canceled';
    tx.canceledAt = new Date();
    await tx.save();
    return res.json({ message: 'Transaction annulée', transaction: tx });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /transactions/bulk-cancel -> { ids: string[] }
router.post('/bulk-cancel', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ error: 'Liste d\'identifiants requise' });
    const txs = await Transaction.find({ _id: { $in: ids } });
    let canceled = 0;
    for (const tx of txs) {
      if (tx.status === 'canceled') continue;
      if (tx.type === 'deposit') {
        const acc = await Account.findOne({ accountNumber: tx.accountNumber });
        if (acc) {
          const newBal = Number((acc.balance || 0) - (tx.amount || 0));
          acc.balance = newBal < 0 ? 0 : newBal;
          await acc.save();
        }
      }
      tx.status = 'canceled';
      tx.canceledAt = new Date();
      await tx.save();
      canceled += 1;
    }
    return res.json({ message: 'Transactions annulées', canceled });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
