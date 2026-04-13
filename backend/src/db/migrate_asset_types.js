require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { getDb } = require('./database');

const db = getDb();

// SQLite can't ALTER a CHECK constraint — recreate the assets table with updated types
db.exec(`
  PRAGMA foreign_keys = OFF;

  -- Rename old table
  ALTER TABLE assets RENAME TO assets_old;

  -- Create new table with updated asset_type check
  CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT UNIQUE NOT NULL,
    asset_type TEXT NOT NULL CHECK(asset_type IN (
      'laptop','desktop','cpu','keyboard','mouse','printer',
      'mobile','cctv','router','sim','other'
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

  -- Copy existing data
  INSERT INTO assets SELECT * FROM assets_old;

  -- Drop old table
  DROP TABLE assets_old;

  -- Recreate indexes
  CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
  CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

  PRAGMA foreign_keys = ON;
`);

console.log('✅ Migration complete — asset types updated (added: CPU, Router, SIM)');
