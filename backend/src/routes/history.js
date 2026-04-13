const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/history  (global history)
router.get('/', authenticate, (req, res) => {
  const { action, asset_id, page = 1, limit = 50 } = req.query;
  const db = getDb();

  let query = `
    SELECT h.*, a.asset_id AS asset_code, a.brand, a.model, a.asset_type
    FROM asset_history h
    JOIN assets a ON a.id = h.asset_id
    WHERE 1=1
  `;
  const params = [];

  if (action) { query += ` AND h.action = ?`; params.push(action); }
  if (asset_id) { query += ` AND h.asset_id = ?`; params.push(asset_id); }

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM (${query}) sub`).get(...params);

  query += ` ORDER BY h.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const data = db.prepare(query).all(...params);
  res.json({ success: true, data, total });
});

// GET /api/history/asset/:assetId
router.get('/asset/:assetId', authenticate, (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT h.*, a.asset_id AS asset_code, a.brand, a.model
    FROM asset_history h
    JOIN assets a ON a.id = h.asset_id
    WHERE h.asset_id = ?
    ORDER BY h.created_at DESC
  `).all(req.params.assetId);
  res.json({ success: true, data });
});

module.exports = router;
