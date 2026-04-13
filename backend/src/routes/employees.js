const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/employees
router.get('/', authenticate, (req, res) => {
  const { search, department, page = 1, limit = 50 } = req.query;
  const db = getDb();

  const showInactive = req.query.show_inactive === 'true';

  let query = `
    SELECT e.*,
      COUNT(CASE WHEN a.status = 'active' THEN 1 END) AS active_assignments
    FROM employees e
    LEFT JOIN assignments a ON a.employee_id = e.id
    WHERE (e.is_active = 1 ${showInactive ? 'OR e.is_active = 0' : ''})
  `;
  const params = [];

  if (search) {
    query += ` AND (e.name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (department) { query += ` AND e.department = ?`; params.push(department); }

  query += ` GROUP BY e.id ORDER BY e.name ASC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const employees = db.prepare(query).all(...params);
  const { total } = db.prepare(`SELECT COUNT(*) as total FROM employees WHERE is_active = 1 ${showInactive ? 'OR is_active = 0' : ''}`).get();

  res.json({ success: true, data: employees, total });
});

// GET /api/employees/departments
router.get('/departments', authenticate, (req, res) => {
  const db = getDb();
  const depts = db.prepare('SELECT DISTINCT department FROM employees WHERE is_active = 1 ORDER BY department').all();
  res.json({ success: true, data: depts.map(d => d.department) });
});

// GET /api/employees/:id
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

  const assignments = db.prepare(`
    SELECT asgn.*, ast.asset_id, ast.asset_type, ast.brand, ast.model, ast.serial_number
    FROM assignments asgn
    JOIN assets ast ON ast.id = asgn.asset_id
    WHERE asgn.employee_id = ?
    ORDER BY asgn.assigned_date DESC
  `).all(employee.id);

  res.json({ success: true, data: { ...employee, assignments } });
});

// POST /api/employees
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { employee_id, name, email, department, designation, phone } = req.body;
  if (!employee_id || !name || !department) {
    return res.status(400).json({ success: false, message: 'employee_id, name, and department are required' });
  }

  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO employees (employee_id, name, email, department, designation, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(employee_id, name, email || null, department, designation || null, phone || null);

    res.status(201).json({ success: true, message: 'Employee created', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists' });
    }
    throw err;
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Employee not found' });

  const { name, email, department, designation, phone, is_active } = req.body;
  db.prepare(`
    UPDATE employees SET
      name = COALESCE(?, name),
      email = ?,
      department = COALESCE(?, department),
      designation = ?,
      phone = ?,
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name || null, email || null, department || null, designation || null,
    phone || null, is_active !== undefined ? is_active : null, req.params.id);

  res.json({ success: true, message: 'Employee updated' });
});

// DELETE /api/employees/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const active = db.prepare("SELECT id FROM assignments WHERE employee_id = ? AND status = 'active'").get(req.params.id);
  if (active) {
    return res.status(400).json({ success: false, message: 'Employee has active assignments. Return all assets first.' });
  }
  // Soft delete
  db.prepare("UPDATE employees SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Employee deactivated' });
});

module.exports = router;
