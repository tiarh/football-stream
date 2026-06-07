const db = require('better-sqlite3')('/root/football-stream/data/football.db');

console.log('🔧 Fixing database schema...\n');

try {
  // Check if columns exist
  const columns = db.prepare("PRAGMA table_info(streams)").all();
  const columnNames = columns.map(c => c.name);
  
  if (!columnNames.includes('type')) {
    db.exec("ALTER TABLE streams ADD COLUMN type TEXT DEFAULT 'embed'");
    console.log('✓ Added "type" column');
  } else {
    console.log('✓ "type" column already exists');
  }
  
  if (!columnNames.includes('note')) {
    db.exec("ALTER TABLE streams ADD COLUMN note TEXT");
    console.log('✓ Added "note" column');
  } else {
    console.log('✓ "note" column already exists');
  }
  
  console.log('\n✅ Database schema updated!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
