/**
 * cleanup-old-fixtures.js
 * Remove old/expired World Cup 2026 fixtures from DB
 * Run: node scripts/cleanup-old-fixtures.js
 */

const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

// These dates are past — safe to delete
const oldFixtures = [
  // Group A
  ['USA', 'Bolivia', '2026-06-11'],
  ['Canada', 'Mexico', '2026-06-11'],
  ['Mexico', 'USA', '2026-06-15'],
  ['Bolivia', 'Canada', '2026-06-15'],
  // Group B
  ['Spain', 'New Zealand', '2026-06-12'],
  ['Australia', 'Netherlands', '2026-06-12'],
  ['Netherlands', 'Spain', '2026-06-16'],
  ['New Zealand', 'Australia', '2026-06-16'],
  // Group C
  ['Argentina', 'Chile', '2026-06-12'],
  ['Brazil', 'Colombia', '2026-06-12'],
  ['Colombia', 'Argentina', '2026-06-16'],
  ['Chile', 'Brazil', '2026-06-16'],
  // Group D
  ['Germany', 'Italy', '2026-06-13'],
  ['France', 'Portugal', '2026-06-13'],
  ['Portugal', 'Germany', '2026-06-17'],
  ['Italy', 'France', '2026-06-17'],
  // Group E
  ['Japan', 'South Korea', '2026-06-13'],
  ['Saudi Arabia', 'Iran', '2026-06-13'],
  ['Iran', 'Japan', '2026-06-17'],
  ['South Korea', 'Saudi Arabia', '2026-06-17'],
  // Group F
  ['England', 'Serbia', '2026-06-14'],
  ['Belgium', 'Wales', '2026-06-14'],
  ['Wales', 'England', '2026-06-18'],
  ['Serbia', 'Belgium', '2026-06-18'],
  // Group G
  ['Uruguay', 'Ecuador', '2026-06-14'],
  ['Paraguay', 'Venezuela', '2026-06-14'],
  ['Venezuela', 'Uruguay', '2026-06-18'],
  ['Ecuador', 'Paraguay', '2026-06-18'],
  // Group H
  ['Morocco', 'Croatia', '2026-06-14'],
  ['Denmark', 'Algeria', '2026-06-14'],
  ['Algeria', 'Morocco', '2026-06-18'],
  ['Croatia', 'Denmark', '2026-06-18'],
];

let deletedMatches = 0, deletedStreams = 0;

oldFixtures.forEach(f => {
  const match = Database.prepare(
    "SELECT id FROM matches WHERE home_team = ? AND away_team = ? AND match_date LIKE ?"
  ).get(f[0], f[1], f[2] + '%');
  
  if (match) {
    const streams = Database.prepare('DELETE FROM streams WHERE match_id = ?').run(match.id);
    deletedStreams += streams.changes;
    const matches = Database.prepare('DELETE FROM matches WHERE id = ?').run(match.id);
    deletedMatches += matches.changes;
    console.log(`🗑️  Deleted: ${f[0]} vs ${f[1]} | Streams removed: ${streams.changes}`);
  } else {
    console.log(`⏭️  Not found: ${f[0]} vs ${f[1]}`);
  }
});

console.log(`\nTotal deleted: ${deletedMatches} matches, ${deletedStreams} streams`);