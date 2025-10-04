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

// CORS: allow all origins during development (adjust for production)
app.use(cors());
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
    app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
    // run seed without blocking server start
    runSeed()
      .then(() => console.log('Seed completed'))
      .catch((e) => console.warn('Seed failed', e?.message || e));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
