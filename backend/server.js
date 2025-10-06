import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './src/routes/auth.js';
import Agent from './src/routes/agents.js'
import transactionsRouter from './src/routes/transactions.js';
import { connectDB } from './src/db.js';
import usersRouter from './src/routes/users.js';
import { runSeed } from './src/seed.js';
import accountsRouter from './src/routes/accounts.js';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow frontend from Vercel (all preview subdomains) and local dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  // Known deployed/preview URLs
  'https://gestion-agent.vercel.app',
  'https://gestion-agent-git-main-habibeees-projects.vercel.app',
  'https://gestion-agent-rk6sfrvw0-habibeees-projects.vercel.app',
  // Newly reported deployed URL
  'https://gestion-agent-arjxkqthw-habibeees-projects.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Ensure preflight is handled
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'miniBnAg-backend' });
});

app.use('/auth', authRouter);
app.use('/transactions', transactionsRouter);
app.use('/users', usersRouter);
app.use('/agent', Agent)
app.use('/accounts', accountsRouter);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// start after DB connection
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
    // run seed without blocking server start
    runSeed()
      .then(() => console.log('Seed completed'))
      .catch((e) => console.warn('Seed failed', e?.message || e));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
