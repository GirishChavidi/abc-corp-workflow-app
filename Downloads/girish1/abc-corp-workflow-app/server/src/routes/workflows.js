import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createWorkflowRoutes(db) {
const router = Router();
router.use(authenticateToken);

// ─── List workflow templates ────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT wt.*, u.name as creator_name
      FROM workflow_templates wt
      LEFT JOIN users u ON wt.created_by = u.id
      ORDER BY wt.created_at DESC
    `).all();

    res.json(templates.map(t => ({
      ...t,
      workflow_data: JSON.parse(t.workflow_data || '{}')
    })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get single template ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM workflow_templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    template.workflow_data = JSON.parse(template.workflow_data || '{}');
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create template ────────────────────────────────────────────────────────
router.post('/', requireRole('account_manager'), (req, res) => {
  try {
    const { name, description, workflow_data } = req.body;
    if (!name || !workflow_data) return res.status(400).json({ error: 'name and workflow_data are required' });

    const result = db.prepare(
      'INSERT INTO workflow_templates (name, description, workflow_data, created_by) VALUES (?, ?, ?, ?)'
    ).run(name, description || null, JSON.stringify(workflow_data), req.user.id);

    const template = db.prepare('SELECT * FROM workflow_templates WHERE id = ?').get(result.lastInsertRowid);
    template.workflow_data = JSON.parse(template.workflow_data || '{}');
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete template ────────────────────────────────────────────────────────
router.delete('/:id', requireRole('account_manager'), (req, res) => {
  try {
    db.prepare('DELETE FROM workflow_templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
}

export default createWorkflowRoutes;
