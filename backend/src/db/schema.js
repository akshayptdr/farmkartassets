const { getDb } = require('./database');

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    -- Users (admin/staff accounts)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('admin', 'employee')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Employees (people assets are assigned to)
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      department TEXT NOT NULL,
      designation TEXT,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Assets (inventory items)
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT UNIQUE NOT NULL,
      asset_type TEXT NOT NULL CHECK(asset_type IN (
        'laptop','desktop','keyboard','mouse','printer',
        'mobile','cctv','cpu','router','sim','other'
      )),
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT UNIQUE,
      purchase_date TEXT,
      purchase_price REAL,
      warranty_expiry TEXT,
      condition TEXT NOT NULL DEFAULT 'good' CHECK(condition IN ('new','good','fair','damaged','retired')),
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','assigned','under_repair','retired')),
      location TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Asset images / documents
    CREATE TABLE IF NOT EXISTS asset_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      file_type TEXT NOT NULL CHECK(file_type IN ('photo','bill','document')),
      file_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      uploaded_by INTEGER REFERENCES users(id),
      drive_file_id TEXT,
      web_view_link TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Assignments
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      assigned_date TEXT NOT NULL DEFAULT (date('now')),
      expected_return_date TEXT,
      actual_return_date TEXT,
      assigned_by INTEGER REFERENCES users(id),
      return_condition TEXT CHECK(return_condition IN ('good','fair','damaged')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','returned')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Asset history (audit log)
    CREATE TABLE IF NOT EXISTS asset_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK(action IN (
        'created','updated','assigned','returned','repaired',
        'transferred','condition_changed','retired','image_added','image_removed'
      )),
      description TEXT NOT NULL,
      performed_by INTEGER REFERENCES users(id),
      performed_by_name TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
    CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
    CREATE INDEX IF NOT EXISTS idx_assignments_asset ON assignments(asset_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
    CREATE INDEX IF NOT EXISTS idx_history_asset ON asset_history(asset_id);
    CREATE INDEX IF NOT EXISTS idx_history_created ON asset_history(created_at);
  `);

  // Add Google Drive columns if they don't exist (safe migration)
  try { db.exec(`ALTER TABLE asset_files ADD COLUMN drive_file_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE asset_files ADD COLUMN web_view_link TEXT`); } catch {}

  console.log('✅ Database initialized successfully');
}

module.exports = { initializeDatabase };
