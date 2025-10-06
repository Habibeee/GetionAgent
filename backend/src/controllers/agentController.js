import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Agent from '../models/Agent.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const register = async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body || {};
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Champs requis: nom, prenom, email, password' });
    }

    const existing = await Agent.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const agent = await Agent.create({ nom, prenom, email, passwordHash });

    const token = jwt.sign({ sub: agent._id, role: 'agent', email: agent.email }, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash: _, ...agentSafe } = agent.toObject();
    return res.status(201).json({ message: 'Agent créé', token, agent: agentSafe });
  } catch (err) {
    console.error('register agent error:', err);
    return res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const agent = await Agent.findOne({ email });
    if (!agent) return res.status(401).json({ error: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, agent.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = jwt.sign({ sub: agent._id, role: 'agent', email: agent.email }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...agentSafe } = agent.toObject();

    return res.json({ message: 'Connexion réussie', token, agent: agentSafe });
  } catch (err) {
    console.error('login agent error:', err);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate ObjectId to avoid CastError 500s
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "ID d'agent invalide" });
    }
    const agent = await Agent.findById(id).select('-passwordHash');
    if (!agent) return res.status(404).json({ error: 'Agent introuvable' });
    return res.json({ data: agent });
  } catch (err) {
    console.error('get agent by id error:', err?.message || err);
    return res.status(500).json({ error: "Erreur lors de la récupération de l'agent" });
  }
};
