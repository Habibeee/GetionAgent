import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './src/routes/auth.js';
import Agent from './src/routes/agents.js';
import transactionsRouter from './src/routes/transactions.js';
import { connectDB } from './src/db.js';
import usersRouter from './src/routes/users.js';
import { runSeed } from './src/seed.js';
import accountsRouter from './src/routes/accounts.js';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;

// 🧩 Pour résoudre les chemins en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://gestion-agent.vercel.app',
  'https://gestion-agent-git-main-habibeees-projects.vercel.app',
  'https://gestion-agent-rk6sfrvw0-habibeees-projects.vercel.app',
  'https://gestion-agent-arjxkqthw-habibeees-projects.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isExplicit = allowedOrigins.includes(origin);
      const isVercelPreview = /\.vercel\.app$/.test(origin) && origin.includes('habibeees-projects');
      if (isExplicit || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

// ✅ Route de test
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'miniBnAg-backend' });
});

// ✅ Routes API
app.use('/auth', authRouter);
app.use('/transactions', transactionsRouter);
app.use('/users', usersRouter);
app.use('/agent', Agent);
app.use('/accounts', accountsRouter);

// 🧩 AJOUT ICI : servir ton frontend React
app.use(express.static(path.join(__dirname, 'prjagent/build')));

// 🧩 Pour toute autre route, renvoyer React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'prjagent/build', 'index.html'));
});

// ❗ ATTENTION : ce bloc doit venir *après* express.static, sinon React ne s'affichera pas
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 🧠 Démarrage du serveur
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Backend listening on port ${PORT}`));
    runSeed()
      .then(() => console.log('Seed completed'))
      .catch((e) => console.warn('Seed failed', e?.message || e));
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  });
