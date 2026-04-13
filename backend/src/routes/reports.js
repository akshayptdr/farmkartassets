const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/stats  (dashboard statistics)
router.get('/stats', authenticate, (req, res) => {
  const db = getDb();

  const totalAssets    = db.prepare('SELECT COUNT(*) as c FROM assets').get().c;
  const assignedAssets = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'assigned'").get().c;
  const available      = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'available'").get().c;
  const underRepair    = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'under_repair'").get().c;
  const retired        = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status = 'retired'").get().c;
  const overdueCount   = db.prepare("SELECT COUNT(*) as c FROM assignments WHERE status = 'active' AND expected_return_date < date('now')").get().c;
  const totalEmployees = db.prepare('SELECT COUNT(*) as c FROM employees WHERE is_active = 1').get().c;

  const byType = db.prepare(`
    SELECT asset_type, COUNT(*) as count,
      SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available
    FROM assets GROUP BY asset_type ORDER BY count DESC
  `).all();

  const byDepartment = db.prepare(`
    SELECT e.department, COUNT(DISTINCT asgn.id) as assigned_assets
    FROM assignments asgn
    JOIN employees e ON e.id = asgn.employee_id
    WHERE asgn.status = 'active'
    GROUP BY e.department ORDER BY assigned_assets DESC
  `).all();

  const recentActivity = db.prepare(`
    SELECT h.action, h.description, h.performed_by_name, h.created_at,
      a.asset_id AS asset_code, a.brand, a.model
    FROM asset_history h
    JOIN assets a ON a.id = h.asset_id
    ORDER BY h.created_at DESC LIMIT 10
  `).all();

  const purchaseValue = db.prepare('SELECT SUM(purchase_price) as total FROM assets WHERE purchase_price IS NOT NULL').get();

  res.json({
    success: true,
    data: {
      overview: { totalAssets, assignedAssets, available, underRepair, retired, overdueCount, totalEmployees },
      purchaseValue: purchaseValue.total || 0,
      byType,
      byDepartment,
      recentActivity
    }
  });
});

// GET /api/reports/export/csv  (export assets as CSV)
router.get('/export/csv', authenticate, (req, res) => {
  const { type, status } = req.query;
  const db = getDb();

  let query = `
    SELECT a.asset_id, a.asset_type, a.brand, a.model, a.serial_number,
      a.purchase_date, a.purchase_price, a.warranty_expiry, a.condition, a.status,
      a.location, a.notes, a.created_at,
      e.name AS assigned_to, e.employee_id AS employee_code, e.department,
      asgn.assigned_date, asgn.expected_return_date
    FROM assets a
    LEFT JOIN assignments asgn ON asgn.asset_id = a.id AND asgn.status = 'active'
    LEFT JOIN employees e ON e.id = asgn.employee_id
    WHERE 1=1
  `;
  const params = [];
  if (type) { query += ` AND a.asset_type = ?`; params.push(type); }
  if (status) { query += ` AND a.status = ?`; params.push(status); }
  query += ` ORDER BY a.asset_type, a.asset_id`;

  const rows = db.prepare(query).all(...params);

  const headers = [
    'Asset ID', 'Type', 'Brand', 'Model', 'Serial Number',
    'Purchase Date', 'Purchase Price (₹)', 'Warranty Expiry',
    'Condition', 'Status', 'Location', 'Notes',
    'Assigned To', 'Employee ID', 'Department',
    'Assigned Date', 'Expected Return', 'Added On'
  ];

  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      r.asset_id, r.asset_type, r.brand, r.model, r.serial_number,
      r.purchase_date, r.purchase_price, r.warranty_expiry,
      r.condition, r.status, r.location, r.notes,
      r.assigned_to, r.employee_code, r.department,
      r.assigned_date, r.expected_return_date, r.created_at
    ].map(escape).join(','))
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="assets_export_${Date.now()}.csv"`);
  res.send(csvLines.join('\r\n'));
});

// GET /api/reports/export/assignments/csv
router.get('/export/assignments/csv', authenticate, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT asgn.id, ast.asset_id AS asset_code, ast.asset_type, ast.brand, ast.model,
      e.name AS employee_name, e.employee_id AS employee_code, e.department,
      asgn.assigned_date, asgn.expected_return_date, asgn.actual_return_date,
      asgn.status, asgn.return_condition, asgn.notes
    FROM assignments asgn
    JOIN assets ast ON ast.id = asgn.asset_id
    JOIN employees e ON e.id = asgn.employee_id
    ORDER BY asgn.created_at DESC
  `).all();

  const headers = [
    'ID', 'Asset Code', 'Type', 'Brand', 'Model',
    'Employee Name', 'Employee ID', 'Department',
    'Assigned Date', 'Expected Return', 'Actual Return',
    'Status', 'Return Condition', 'Notes'
  ];

  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      r.id, r.asset_code, r.asset_type, r.brand, r.model,
      r.employee_name, r.employee_code, r.department,
      r.assigned_date, r.expected_return_date, r.actual_return_date,
      r.status, r.return_condition, r.notes
    ].map(escape).join(','))
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="assignments_export_${Date.now()}.csv"`);
  res.send(csvLines.join('\r\n'));
});

module.exports = router;
