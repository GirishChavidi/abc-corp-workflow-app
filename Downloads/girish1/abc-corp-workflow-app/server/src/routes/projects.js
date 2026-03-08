import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createProjectRoutes(db) {

const router = Router();
router.use(authenticateToken);

// ─── Validate on-site project has >= 2 trainings ───────────────────────────
function validateOnsiteTrainings(projectId) {
  const project = db.prepare('SELECT type FROM projects WHERE id = ?').get(projectId);
  if (!project) return { valid: false, error: 'Project not found' };
  if (project.type === 'on-site') {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM trainings WHERE project_id = ?').get(projectId);
    if (count.cnt < 2) {
      return { valid: false, error: 'On-site projects require at least 2 trainings' };
    }
  }
  return { valid: true };
}

// ─── List projects ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    let query = `
      SELECT p.*, c.name as client_name, u.name as manager_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.account_manager_id = u.id
    `;
    const params = [];

    // If client role, only show their projects
    if (req.user.role === 'client' && req.user.client_id) {
      query += ' WHERE p.client_id = ?';
      params.push(req.user.client_id);
    }

    query += ' ORDER BY p.created_at DESC';
    const projects = db.prepare(query).all(...params);

    const parsed = projects.map(p => ({
      ...p,
      workflow_data: JSON.parse(p.workflow_data || '{}')
    }));

    res.json(parsed);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get single project with full details ───────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*, c.name as client_name, u.name as manager_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.account_manager_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Access control for client users
    if (req.user.role === 'client' && req.user.client_id !== project.client_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    project.workflow_data = JSON.parse(project.workflow_data || '{}');

    // Get trainings
    const trainings = db.prepare(`
      SELECT t.*, v.name as vendor_name
      FROM trainings t
      LEFT JOIN vendors v ON t.vendor_id = v.id
      WHERE t.project_id = ?
    `).all(req.params.id);

    // Get trainees
    const trainees = db.prepare(`
      SELECT pt.*, tr.name as trainee_name, tr.email as trainee_email, tr.phone as trainee_phone
      FROM project_trainees pt
      JOIN trainees tr ON pt.trainee_id = tr.id
      WHERE pt.project_id = ?
    `).all(req.params.id);

    res.json({ ...project, trainings, trainees });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create project ─────────────────────────────────────────────────────────
router.post('/', requireRole('account_manager'), (req, res) => {
  try {
    const { client_id, name, description, type, workflow_data } = req.body;

    if (!client_id || !name || !type) {
      return res.status(400).json({ error: 'client_id, name, and type are required' });
    }
    if (!['on-site', 'off-site'].includes(type)) {
      return res.status(400).json({ error: 'type must be on-site or off-site' });
    }

    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(client_id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const result = db.prepare(
      `INSERT INTO projects (client_id, account_manager_id, name, description, type, workflow_data)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(client_id, req.user.id, name, description || null, type, JSON.stringify(workflow_data || {}));

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    project.workflow_data = JSON.parse(project.workflow_data || '{}');
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update project ─────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const { name, description, type, status, workflow_data } = req.body;
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (workflow_data !== undefined) { updates.push('workflow_data = ?'); params.push(JSON.stringify(workflow_data)); }

    params.push(req.params.id);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Validate on-site constraint when activating
    if (status === 'active') {
      const validation = validateOnsiteTrainings(Number(req.params.id));
      if (!validation.valid) {
        // Revert status
        db.prepare("UPDATE projects SET status = 'draft' WHERE id = ?").run(req.params.id);
        return res.status(400).json({ error: validation.error });
      }
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.workflow_data = JSON.parse(project.workflow_data || '{}');
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Save workflow for a project ────────────────────────────────────────────
router.put('/:id/workflow', (req, res) => {
  try {
    const { workflow_data } = req.body;
    if (!workflow_data) return res.status(400).json({ error: 'workflow_data is required' });

    db.prepare('UPDATE projects SET workflow_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(workflow_data), req.params.id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.workflow_data = JSON.parse(project.workflow_data || '{}');
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══ Trainings sub-routes ═══════════════════════════════════════════════════

// ─── Add training to project ────────────────────────────────────────────────
router.post('/:id/trainings', requireRole('account_manager'), (req, res) => {
  try {
    const project_id = Number(req.params.id);
    const { type, vendor_id, paid_by, certification_required } = req.body;

    if (!type || !paid_by) {
      return res.status(400).json({ error: 'type and paid_by are required' });
    }
    if (!['computer_skills', 'business_skills', 'logic_skills'].includes(type)) {
      return res.status(400).json({ error: 'type must be computer_skills, business_skills, or logic_skills' });
    }

    // Check for duplicate training type on same project
    const existing = db.prepare('SELECT id FROM trainings WHERE project_id = ? AND type = ?').get(project_id, type);
    if (existing) {
      return res.status(409).json({ error: `Training type ${type} already exists for this project` });
    }

    const result = db.prepare(
      'INSERT INTO trainings (project_id, type, vendor_id, paid_by, certification_required) VALUES (?, ?, ?, ?, ?)'
    ).run(project_id, type, vendor_id || null, paid_by, certification_required ? 1 : 0);

    const training = db.prepare(`
      SELECT t.*, v.name as vendor_name FROM trainings t LEFT JOIN vendors v ON t.vendor_id = v.id WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(training);
  } catch (err) {
    console.error('Add training error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update training ────────────────────────────────────────────────────────
router.put('/:id/trainings/:trainingId', requireRole('account_manager'), (req, res) => {
  try {
    const { vendor_id, paid_by, certification_required, status } = req.body;
    const updates = [];
    const params = [];

    if (vendor_id !== undefined) { updates.push('vendor_id = ?'); params.push(vendor_id); }
    if (paid_by !== undefined) { updates.push('paid_by = ?'); params.push(paid_by); }
    if (certification_required !== undefined) { updates.push('certification_required = ?'); params.push(certification_required ? 1 : 0); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.trainingId);
    db.prepare(`UPDATE trainings SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const training = db.prepare(`
      SELECT t.*, v.name as vendor_name FROM trainings t LEFT JOIN vendors v ON t.vendor_id = v.id WHERE t.id = ?
    `).get(req.params.trainingId);
    res.json(training);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete training ────────────────────────────────────────────────────────
router.delete('/:id/trainings/:trainingId', requireRole('account_manager'), (req, res) => {
  try {
    const project = db.prepare('SELECT type FROM projects WHERE id = ?').get(req.params.id);
    const trainingCount = db.prepare('SELECT COUNT(*) as cnt FROM trainings WHERE project_id = ?').get(req.params.id);

    if (project && project.type === 'on-site' && trainingCount.cnt <= 2) {
      return res.status(400).json({ error: 'On-site projects require at least 2 trainings. Cannot delete.' });
    }

    db.prepare('DELETE FROM trainings WHERE id = ? AND project_id = ?').run(req.params.trainingId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══ Trainees sub-routes ════════════════════════════════════════════════════

// ─── Add trainee to project ─────────────────────────────────────────────────
router.post('/:id/trainees', requireRole('account_manager'), (req, res) => {
  try {
    const project_id = Number(req.params.id);
    const { trainee_id, name, email, phone } = req.body;

    let tid = trainee_id;

    // Create new trainee if no ID provided
    if (!tid && name) {
      const result = db.prepare(
        'INSERT INTO trainees (name, email, phone) VALUES (?, ?, ?)'
      ).run(name, email || null, phone || null);
      tid = result.lastInsertRowid;
    }

    if (!tid) return res.status(400).json({ error: 'trainee_id or name required' });

    db.prepare(
      'INSERT INTO project_trainees (project_id, trainee_id) VALUES (?, ?)'
    ).run(project_id, tid);

    const pt = db.prepare(`
      SELECT pt.*, t.name as trainee_name, t.email as trainee_email
      FROM project_trainees pt JOIN trainees t ON pt.trainee_id = t.id
      WHERE pt.project_id = ? AND pt.trainee_id = ?
    `).get(project_id, tid);

    res.status(201).json(pt);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Trainee already assigned to this project' });
    }
    console.error('Add trainee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update trainee status in project ───────────────────────────────────────
router.put('/:id/trainees/:ptId', (req, res) => {
  try {
    const { status, interview_date, interview_notes, offer_date, hire_date } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (interview_date) { updates.push('interview_date = ?'); params.push(interview_date); }
    if (interview_notes !== undefined) { updates.push('interview_notes = ?'); params.push(interview_notes); }
    if (offer_date) { updates.push('offer_date = ?'); params.push(offer_date); }
    if (hire_date) { updates.push('hire_date = ?'); params.push(hire_date); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.ptId);
    db.prepare(`UPDATE project_trainees SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const pt = db.prepare(`
      SELECT pt.*, t.name as trainee_name, t.email as trainee_email
      FROM project_trainees pt JOIN trainees t ON pt.trainee_id = t.id
      WHERE pt.id = ?
    `).get(req.params.ptId);
    res.json(pt);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══ Dashboard stats ════════════════════════════════════════════════════════
router.get('/stats/dashboard', (req, res) => {
  try {
    let whereClause = '';
    const params = [];

    if (req.user.role === 'client' && req.user.client_id) {
      whereClause = 'WHERE p.client_id = ?';
      params.push(req.user.client_id);
    }

    const totalProjects = db.prepare(`SELECT COUNT(*) as count FROM projects p ${whereClause}`).get(...params).count;
    const activeProjects = db.prepare(`SELECT COUNT(*) as count FROM projects p ${whereClause ? whereClause + " AND" : "WHERE"} p.status = 'active'`).get(...params).count;
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const totalTrainees = db.prepare('SELECT COUNT(DISTINCT trainee_id) as count FROM project_trainees').get().count;
    const totalVendors = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;

    const recentProjects = db.prepare(`
      SELECT p.*, c.name as client_name
      FROM projects p LEFT JOIN clients c ON p.client_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC LIMIT 5
    `).all(...params);

    res.json({
      totalProjects,
      activeProjects,
      totalClients,
      totalTrainees,
      totalVendors,
      recentProjects: recentProjects.map(p => ({ ...p, workflow_data: JSON.parse(p.workflow_data || '{}') }))
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
}

export default createProjectRoutes;
