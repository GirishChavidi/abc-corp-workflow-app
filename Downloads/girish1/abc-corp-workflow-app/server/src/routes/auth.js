import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

export function createAuthRoutes(db) {
const router = Router();

// ─── Register ───────────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  try {
    const { email, password, name, role, client_id, designation, phone } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, and role are required' });
    }
    if (!['account_manager', 'client'].includes(role)) {
      return res.status(400).json({ error: 'role must be account_manager or client' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      `INSERT INTO users (email, password_hash, name, role, client_id, designation, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(email, password_hash, name, role, client_id || null, designation || null, phone || null);

    const user = db.prepare('SELECT id, email, name, role, client_id FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, client_id: user.client_id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Login ──────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role, client_id: user.client_id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({ user: payload, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get current user ───────────────────────────────────────────────────────
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, client_id, designation, phone FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
}

export default createAuthRoutes;
