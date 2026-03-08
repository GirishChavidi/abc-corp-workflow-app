import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { dbReady } from './database.js';

import { createAuthRoutes } from './routes/auth.js';
import { createClientRoutes } from './routes/clients.js';
import { createVendorRoutes } from './routes/vendors.js';
import { createProjectRoutes } from './routes/projects.js';
import { createTraineeRoutes } from './routes/trainees.js';
import { createWorkflowRoutes } from './routes/workflows.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Initialize DB then mount routes and start ──────────────────────────────
dbReady.then((db) => {
  app.use('/api/auth', createAuthRoutes(db));
  app.use('/api/clients', createClientRoutes(db));
  app.use('/api/vendors', createVendorRoutes(db));
  app.use('/api/projects', createProjectRoutes(db));
  app.use('/api/trainees', createTraineeRoutes(db));
  app.use('/api/workflows', createWorkflowRoutes(db));

  app.listen(PORT, () => {
    console.log(`ABC Corp API server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
