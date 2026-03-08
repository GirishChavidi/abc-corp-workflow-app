import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createTraineeRoutes(db) {
const router = Router();
router.use(authenticateToken);

// ─── List all trainees ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const trainees = db.prepare('SELECT * FROM trainees ORDER BY name').all();
    res.json(trainees.map(t => ({ ...t, skills: JSON.parse(t.skills || '[]') })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get trainee with project history ───────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(req.params.id);
    if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
    trainee.skills = JSON.parse(trainee.skills || '[]');

    const assignments = db.prepare(`
      SELECT pt.*, p.name as project_name, p.type as project_type, c.name as client_name
      FROM project_trainees pt
      JOIN projects p ON pt.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE pt.trainee_id = ?
    `).all(req.params.id);

    res.json({ ...trainee, assignments });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create trainee ─────────────────────────────────────────────────────────
router.post('/', requireRole('account_manager'), (req, res) => {
  try {
    const { name, email, phone, skills } = req.body;
    if (!name) return res.status(400).json({ error: 'Trainee name is required' });

    const result = db.prepare(
      'INSERT INTO trainees (name, email, phone, skills) VALUES (?, ?, ?, ?)'
    ).run(name, email || null, phone || null, JSON.stringify(skills || []));

    const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(result.lastInsertRowid);
    trainee.skills = JSON.parse(trainee.skills || '[]');
    res.status(201).json(trainee);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Trainee email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update trainee ─────────────────────────────────────────────────────────
router.put('/:id', requireRole('account_manager'), (req, res) => {
  try {
    const { name, email, phone, skills } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (skills !== undefined) { updates.push('skills = ?'); params.push(JSON.stringify(skills)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    db.prepare(`UPDATE trainees SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const trainee = db.prepare('SELECT * FROM trainees WHERE id = ?').get(req.params.id);
    if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
    trainee.skills = JSON.parse(trainee.skills || '[]');
    res.json(trainee);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
}

export default createTraineeRoutes;
