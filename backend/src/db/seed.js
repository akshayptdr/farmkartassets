require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { getDb } = require('./database');
const { initializeDatabase } = require('./schema');

initializeDatabase();
const db = getDb();

async function seed() {
  console.log('🌱 Initializing database...\n');

  // ── Admin user only ───────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('admin', 'admin@company.com', adminHash, 'admin');

  console.log('✅ Admin user created');
  console.log('\n🎉 Setup complete!\n');
  console.log('Login credentials:');
  console.log('  Admin → username: admin | password: admin123\n');
}

seed().catch(console.error);
