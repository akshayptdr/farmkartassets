const express = require('express');
const QRCode = require('qrcode');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadFileToCloudinary, deleteFileFromCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Helper: log history
function logHistory(db, assetId, action, description, user, oldVal = null, newVal = null) {
  db.prepare(`
    INSERT INTO asset_history (asset_id, action, description, performed_by, performed_by_name, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(assetId, action, description, user.id, user.username, oldVal, newVal);
}

// GET /api/assets
router.get('/', authenticate, (req, res) => {
  const { search, type, status, condition, department, page = 1, limit = 20 } = req.query;
  const db = getDb();

  let query = `
    SELECT a.*,
      e.name AS assigned_to_name,
      e.department AS assigned_to_dept,
      asgn.assigned_date,
      asgn.expected_return_date,
      (SELECT COUNT(*) FROM asset_files af WHERE af.asset_id = a.id AND af.file_type = 'photo') AS photo_count
    FROM assets a
    LEFT JOIN assignments asgn ON asgn.asset_id = a.id AND asgn.status = 'active'
    LEFT JOIN employees e ON e.id = asgn.employee_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (a.asset_id LIKE ? OR a.brand LIKE ? OR a.model LIKE ? OR a.serial_number LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (type) { query += ` AND a.asset_type = ?`; params.push(type); }
  if (status) { query += ` AND a.status = ?`; params.push(status); }
  if (condition) { query += ` AND a.condition = ?`; params.push(condition); }
  if (department) { query += ` AND e.department = ?`; params.push(department); }

  // Count total
  const countQuery = `SELECT COUNT(*) as total FROM (${query}) sub`;
  const { total } = db.prepare(countQuery).get(...params);

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const assets = db.prepare(query).all(...params);
  res.json({ success: true, data: assets, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/assets/:id
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const asset = db.prepare(`
    SELECT a.*,
      e.name AS assigned_to_name, e.employee_id AS assigned_to_emp_id,
      e.department AS assigned_to_dept, e.email AS assigned_to_email,
      asgn.id AS assignment_id, asgn.assigned_date, asgn.expected_return_date, asgn.notes AS assignment_notes
    FROM assets a
    LEFT JOIN assignments asgn ON asgn.asset_id = a.id AND asgn.status = 'active'
    LEFT JOIN employees e ON e.id = asgn.employee_id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const files = db.prepare('SELECT * FROM asset_files WHERE asset_id = ? ORDER BY uploaded_at DESC').all(asset.id);
  const history = db.prepare('SELECT * FROM asset_history WHERE asset_id = ? ORDER BY created_at DESC LIMIT 50').all(asset.id);

  res.json({ success: true, data: { ...asset, files, history } });
});

// POST /api/assets
router.post('/', authenticate, requireAdmin, (req, res) => {
  const {
    asset_id, asset_type, brand, model, serial_number,
    purchase_date, purchase_price, warranty_expiry,
    condition, status, location, notes
  } = req.body;

  if (!asset_id || !asset_type || !brand || !model) {
    return res.status(400).json({ success: false, message: 'asset_id, asset_type, brand, model are required' });
  }

  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO assets (asset_id, asset_type, brand, model, serial_number,
        purchase_date, purchase_price, warranty_expiry, condition, status, location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(asset_id, asset_type, brand, model, serial_number || null,
      purchase_date || null, purchase_price || null, warranty_expiry || null,
      condition || 'good', status || 'available', location || null, notes || null);

    logHistory(db, result.lastInsertRowid, 'created', `Asset ${asset_id} added to inventory`, req.user);
    res.status(201).json({ success: true, message: 'Asset created', id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Asset ID or serial number already exists' });
    }
    throw err;
  }
});

// PUT /api/assets/:id
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Asset not found' });

  const {
    brand, model, serial_number, purchase_date, purchase_price,
    warranty_expiry, condition, status, location, notes
  } = req.body;

  db.prepare(`
    UPDATE assets SET
      brand = COALESCE(?, brand),
      model = COALESCE(?, model),
      serial_number = ?,
      purchase_date = ?,
      purchase_price = ?,
      warranty_expiry = ?,
      condition = COALESCE(?, condition),
      status = COALESCE(?, status),
      location = ?,
      notes = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    brand || null, model || null, serial_number || null, purchase_date || null,
    purchase_price || null, warranty_expiry || null, condition || null,
    status || null, location || null, notes || null, req.params.id
  );

  const changes = [];
  if (status && status !== existing.status) changes.push(`status: ${existing.status} → ${status}`);
  if (condition && condition !== existing.condition) changes.push(`condition: ${existing.condition} → ${condition}`);

  logHistory(db, req.params.id, 'updated',
    changes.length ? `Updated: ${changes.join(', ')}` : 'Asset details updated',
    req.user
  );

  res.json({ success: true, message: 'Asset updated' });
});

// DELETE /api/assets/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const activeAssignment = db.prepare("SELECT id FROM assignments WHERE asset_id = ? AND status = 'active'").get(req.params.id);
  if (activeAssignment) {
    return res.status(400).json({ success: false, message: 'Cannot delete asset with active assignment. Return the asset first.' });
  }

  // Delete associated files from Cloudinary
  const files = db.prepare('SELECT drive_file_id FROM asset_files WHERE asset_id = ?').all(req.params.id);
  for (const f of files) {
    if (f.drive_file_id) await deleteFileFromCloudinary(f.drive_file_id);
  }

  db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Asset deleted' });
});

// POST /api/assets/:id/files
router.post('/:id/files', authenticate, requireAdmin, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const db = getDb();
    const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const fileType = req.body.file_type || 'photo';

    try {
      const cloudFile = await uploadFileToCloudinary({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileType,
      });

      const result = db.prepare(`
        INSERT INTO asset_files (asset_id, file_type, file_path, original_name, mime_type, file_size, uploaded_by, drive_file_id, web_view_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(asset.id, fileType, cloudFile.web_view_link, req.file.originalname, req.file.mimetype, req.file.size, req.user.id, cloudFile.drive_file_id, cloudFile.web_view_link);

      logHistory(db, asset.id, 'image_added', `${fileType} file uploaded: ${req.file.originalname}`, req.user);

      res.status(201).json({
        success: true,
        message: 'File uploaded to Cloudinary',
        file: {
          id: result.lastInsertRowid,
          file_path: cloudFile.web_view_link,
          web_view_link: cloudFile.web_view_link,
          original_name: req.file.originalname,
          file_type: fileType,
        }
      });
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr.message);
      res.status(500).json({ success: false, message: 'Failed to upload file to Cloudinary' });
    }
  });
});

// DELETE /api/assets/:id/files/:fileId
router.delete('/:id/files/:fileId', authenticate, requireAdmin, async (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM asset_files WHERE id = ? AND asset_id = ?').get(req.params.fileId, req.params.id);
  if (!file) return res.status(404).json({ success: false, message: 'File not found' });

  if (file.drive_file_id) await deleteFileFromCloudinary(file.drive_file_id);

  db.prepare('DELETE FROM asset_files WHERE id = ?').run(file.id);
  logHistory(db, req.params.id, 'image_removed', `File removed: ${file.original_name}`, req.user);
  res.json({ success: true, message: 'File deleted' });
});

// GET /api/assets/:id/qrcode
router.get('/:id/qrcode', authenticate, async (req, res) => {
  const db = getDb();
  const asset = db.prepare('SELECT asset_id, brand, model, asset_type FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const qrData = JSON.stringify({
    id: req.params.id,
    asset_id: asset.asset_id,
    type: asset.asset_type,
    brand: asset.brand,
    model: asset.model
  });

  try {
    const qrDataURL = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    res.json({ success: true, qrcode: qrDataURL, asset_id: asset.asset_id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'QR generation failed' });
  }
});

module.exports = router;
