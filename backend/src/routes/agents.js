import { Router } from 'express';
import { register, login, getById } from '../controllers/agentController.js';

const router = Router();

// POST /agents/register
router.post('/register', register);

// POST /agents/login
router.post('/login', login);

// GET /agents/:id
router.get('/:id', getById);

export default router;
