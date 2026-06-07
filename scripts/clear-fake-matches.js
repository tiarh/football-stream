/**
 * Clear FAKE matches from database
 * Only keep matches that are verified from real sources
 */

const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

console.log('🧹 Clearing fake/old matches from database...\n');

// Clear ALL live matches (we'll re-add real ones from schedule)
const clearLive = Database.prepare(`
  UPDATE matches SET status = 'finished' 
  WHERE status = 'live'
`).run();

console.log(`✓ Cleared ${clearLive.changes} "live" matches`);

// Clear matches older than 7 days
const clearOld = Database.prepare(`
  DELETE FROM matches 
  WHERE match_date < datetime('now', '-7 days')
`).run();

console.log(`✓ Deleted ${clearOld.changes} old matches (>7 days)`);

// Clear orphaned streams (no match)
const clearOrphans = Database.prepare(`
  DELETE FROM streams 
  WHERE match_id NOT IN (SELECT id FROM matches)
`).run();

console.log(`✓ Deleted ${clearOrphans.changes} orphaned streams`);

// Show remaining matches
const remaining = Database.prepare(`
  SELECT id, home_team, away_team, league, status, match_date
  FROM matches
  WHERE status IN ('live', 'scheduled')
  ORDER BY match_date DESC
  LIMIT 10
`).all();

console.log(`\n📊 Remaining active matches: ${remaining.length}`);
if (remaining.length > 0) {
  console.log('\nActive matches:');
  for (const match of remaining) {
    const status = match.status === 'live' ? '🔴 LIVE' : '📅 Scheduled';
    console.log(`  ${status}: ${match.home_team} vs ${match.away_team} (${match.league})`);
  }
} else {
  console.log('\nℹ️ No active matches - database is clean!');
  console.log('💡 Run get-real-schedule.js to fetch today\'s real fixtures');
}

console.log('\n✅ Cleanup complete!');
