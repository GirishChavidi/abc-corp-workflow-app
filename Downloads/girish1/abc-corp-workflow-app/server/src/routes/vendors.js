import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createVendorRoutes(db) {
const router = Router();
router.use(authenticateToken);

// ─── List vendors ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY name').all();
    // Parse JSON fields
    const parsed = vendors.map(v => ({
      ...v,
      specializations: JSON.parse(v.specializations || '[]')
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get single vendor ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    vendor.specializations = JSON.parse(vendor.specializations || '[]');
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Create vendor ──────────────────────────────────────────────────────────
router.post('/', requireRole('account_manager'), (req, res) => {
  try {
    const { name, specializations, contact_email, contact_phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Vendor name is required' });

    const result = db.prepare(
      'INSERT INTO vendors (name, specializations, contact_email, contact_phone) VALUES (?, ?, ?, ?)'
    ).run(name, JSON.stringify(specializations || []), contact_email || null, contact_phone || null);

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(result.lastInsertRowid);
    vendor.specializations = JSON.parse(vendor.specializations || '[]');
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update vendor ──────────────────────────────────────────────────────────
router.put('/:id', requireRole('account_manager'), (req, res) => {
  try {
    const { name, specializations, contact_email, contact_phone, status } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (specializations !== undefined) { updates.push('specializations = ?'); params.push(JSON.stringify(specializations)); }
    if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email); }
    if (contact_phone !== undefined) { updates.push('contact_phone = ?'); params.push(contact_phone); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    db.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    vendor.specializations = JSON.parse(vendor.specializations || '[]');
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
}

export default createVendorRoutes;
