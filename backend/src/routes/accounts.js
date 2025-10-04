import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Account from '../models/Account.js';
import User from '../models/User.js';

const router = Router();

// GET /accounts/by-email/:email -> fetch account by owner email
router.get('/by-email/:email', requireAuth, async (req, res) => {
  try {
    const email = String(req.params.email || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email requis' });
    let account = await Account.findOne({ ownerEmail: email });
    if (!account) return res.status(404).json({ error: 'Compte introuvable' });
    return res.json({ data: account });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /accounts/deposit  { amount, accountNumber? , email? }
router.post('/deposit', requireAuth, async (req, res) => {
  try {
    const { amount, accountNumber } = req.body || {};
    let { email } = req.body || {};
    const amt = Number(amount);
    if (!amt || !(amt > 0)) return res.status(400).json({ error: 'Montant invalide' });

    let account = null;
    if (accountNumber) {
      account = await Account.findOne({ accountNumber: String(accountNumber) });
    }

    if (!account && email) {
      email = String(email).toLowerCase();
      account = await Account.findOne({ ownerEmail: email });
      if (!account) {
        // Create account on-the-fly if the user exists and is distributeur
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
        if ((user.type || 'client') !== 'distributeur') {
          return res.status(400).json({ error: "L'utilisateur n'est pas un distributeur" });
        }
        const newAccNumber = `ACCT-${email}`;
        account = await Account.create({ accountNumber: newAccNumber, ownerEmail: email, balance: 0 });
      }
    }

    if (!account) return res.status(404).json({ error: 'Compte introuvable' });

    account.balance = Number((account.balance || 0) + amt);
    await account.save();

    return res.json({ message: 'Dépôt effectué', account });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
