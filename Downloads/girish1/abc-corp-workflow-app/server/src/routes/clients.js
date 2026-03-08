import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createClientRoutes(db) {
const router = Router();
router.use(authenticateToken);

// ─── List clients ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get single client ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const contacts = db.prepare(
      "SELECT id, email, name, designation, phone FROM users WHERE client_id = ? AND role = 'client'"
    ).all(req.params.id);

    const projects = db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ ...client, contacts, projects });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create client ──────────────────────────────────────────────────────────
router.post('/', requireRole('account_manager'), (req, res) => {
  try {
    const { name, industry } = req.body;
    if (!name) return res.status(400).json({ error: 'Client name is required' });

    const result = db.prepare(
      'INSERT INTO clients (name, industry) VALUES (?, ?)'
    ).run(name, industry || null);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update client ──────────────────────────────────────────────────────────
router.put('/:id', requireRole('account_manager'), (req, res) => {
  try {
    const { name, industry, status } = req.body;
    db.prepare(
      'UPDATE clients SET name = COALESCE(?, name), industry = COALESCE(?, industry), status = COALESCE(?, status) WHERE id = ?'
    ).run(name, industry, status, req.params.id);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
}

export default createClientRoutes;
