const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function logHistory(db, assetId, action, description, user) {
  db.prepare(`
    INSERT INTO asset_history (asset_id, action, description, performed_by, performed_by_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(assetId, action, description, user.id, user.username);
}

// GET /api/assignments
router.get('/', authenticate, (req, res) => {
  const { status, employee_id, asset_id, overdue, page = 1, limit = 20 } = req.query;
  const db = getDb();

  let query = `
    SELECT asgn.*,
      ast.asset_id AS asset_code, ast.asset_type, ast.brand, ast.model, ast.serial_number,
      e.name AS employee_name, e.employee_id AS employee_code, e.department,
      u.username AS assigned_by_name
    FROM assignments asgn
    JOIN assets ast ON ast.id = asgn.asset_id
    JOIN employees e ON e.id = asgn.employee_id
    LEFT JOIN users u ON u.id = asgn.assigned_by
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ` AND asgn.status = ?`; params.push(status); }
  if (employee_id) { query += ` AND asgn.employee_id = ?`; params.push(employee_id); }
  if (asset_id) { query += ` AND asgn.asset_id = ?`; params.push(asset_id); }
  if (overdue === 'true') {
    query += ` AND asgn.status = 'active' AND asgn.expected_return_date < date('now')`;
  }

  const countQ = `SELECT COUNT(*) as total FROM (${query}) sub`;
  const { total } = db.prepare(countQ).get(...params);

  query += ` ORDER BY asgn.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const data = db.prepare(query).all(...params);
  res.json({ success: true, data, total });
});

// GET /api/assignments/overdue
router.get('/overdue', authenticate, (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT asgn.*,
      ast.asset_id AS asset_code, ast.asset_type, ast.brand, ast.model,
      e.name AS employee_name, e.employee_id AS employee_code, e.department, e.email AS employee_email,
      CAST(julianday('now') - julianday(asgn.expected_return_date) AS INTEGER) AS days_overdue
    FROM assignments asgn
    JOIN assets ast ON ast.id = asgn.asset_id
    JOIN employees e ON e.id = asgn.employee_id
    WHERE asgn.status = 'active' AND asgn.expected_return_date < date('now')
    ORDER BY asgn.expected_return_date ASC
  `).all();
  res.json({ success: true, data });
});

// GET /api/assignments/:id
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT asgn.*,
      ast.asset_id AS asset_code, ast.asset_type, ast.brand, ast.model, ast.serial_number,
      e.name AS employee_name, e.employee_id AS employee_code, e.department, e.email AS employee_email,
      u.username AS assigned_by_name
    FROM assignments asgn
    JOIN assets ast ON ast.id = asgn.asset_id
    JOIN employees e ON e.id = asgn.employee_id
    LEFT JOIN users u ON u.id = asgn.assigned_by
    WHERE asgn.id = ?
  `).get(req.params.id);

  if (!data) return res.status(404).json({ success: false, message: 'Assignment not found' });
  res.json({ success: true, data });
});

// POST /api/assignments  (assign asset)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { asset_id, employee_id, assigned_date, expected_return_date, notes } = req.body;
  if (!asset_id || !employee_id) {
    return res.status(400).json({ success: false, message: 'asset_id and employee_id are required' });
  }

  const db = getDb();
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
  if (asset.status !== 'available') {
    return res.status(400).json({ success: false, message: `Asset is ${asset.status}, not available for assignment` });
  }

  const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND is_active = 1').get(employee_id);
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

  const doAssign = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO assignments (asset_id, employee_id, assigned_date, expected_return_date, assigned_by, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(asset_id, employee_id, assigned_date || new Date().toISOString().split('T')[0],
      expected_return_date || null, req.user.id, notes || null);

    db.prepare("UPDATE assets SET status = 'assigned', updated_at = datetime('now') WHERE id = ?").run(asset_id);
    logHistory(db, asset_id, 'assigned', `Assigned to ${employee.name} (${employee.employee_id})`, req.user);

    return result.lastInsertRowid;
  });

  const id = doAssign();
  res.status(201).json({ success: true, message: 'Asset assigned successfully', id });
});

// PUT /api/assignments/:id  (return asset)
router.put('/:id/return', authenticate, requireAdmin, (req, res) => {
  const { actual_return_date, return_condition, notes } = req.body;
  const db = getDb();

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  if (assignment.status === 'returned') {
    return res.status(400).json({ success: false, message: 'Asset already returned' });
  }

  const employee = db.prepare('SELECT name, employee_id FROM employees WHERE id = ?').get(assignment.employee_id);

  const doReturn = db.transaction(() => {
    db.prepare(`
      UPDATE assignments SET
        status = 'returned',
        actual_return_date = ?,
        return_condition = ?,
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      actual_return_date || new Date().toISOString().split('T')[0],
      return_condition || 'good',
      notes || null,
      req.params.id
    );

    const newStatus = (return_condition === 'damaged') ? 'under_repair' : 'available';
    const newCondition = return_condition || 'good';

    db.prepare("UPDATE assets SET status = ?, condition = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newStatus, newCondition, assignment.asset_id);

    logHistory(db, assignment.asset_id, 'returned',
      `Returned by ${employee.name} (${employee.employee_id}) in ${newCondition} condition`, req.user);
  });

  doReturn();
  res.json({ success: true, message: 'Asset returned successfully' });
});

// PUT /api/assignments/:id  (update notes/dates)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { expected_return_date, notes } = req.body;
  const db = getDb();

  const assignment = db.prepare('SELECT id FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

  db.prepare(`
    UPDATE assignments SET
      expected_return_date = COALESCE(?, expected_return_date),
      notes = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(expected_return_date || null, notes || null, req.params.id);

  res.json({ success: true, message: 'Assignment updated' });
});

// DELETE /api/assignments/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  if (assignment.status === 'active') {
    return res.status(400).json({ success: false, message: 'Cannot delete active assignment. Return the asset first.' });
  }
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Assignment deleted' });
});

module.exports = router;
