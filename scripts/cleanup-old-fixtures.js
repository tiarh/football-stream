const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

const oldFixtures = [
  ['Mexico', 'Poland', '2026-06-11'],
  ['France', 'Australia', '2026-06-11'],
  ['Argentina', 'Saudi Arabia', '2026-06-12'],
  ['Germany', 'Japan', '2026-06-12'],
  ['Brazil', 'Serbia', '2026-06-13'],
  ['Spain', 'Costa Rica', '2026-06-13'],
  ['England', 'Iran', '2026-06-14'],
  ['USA', 'Wales', '2026-06-14'],
  ['Portugal', 'Ghana', '2026-06-15'],
  ['Netherlands', 'Senegal', '2026-06-15']
];

let deletedMatches = 0, deletedStreams = 0;

oldFixtures.forEach(f => {
  const match = Database.prepare('SELECT id FROM matches WHERE home_team = ? AND away_team = ? AND match_date LIKE ?').get(f[0], f[1], f[2] + '%');
  if (match) {
    const streams = Database.prepare('DELETE FROM streams WHERE match_id = ?').run(match.id);
    deletedStreams += streams.changes;
    const matches = Database.prepare('DELETE FROM matches WHERE id = ?').run(match.id);
    deletedMatches += matches.changes;
    console.log('Deleted:', f[0], 'vs', f[1], '| Streams removed:', streams.changes);
  }
});

console.log('\nTotal deleted:', deletedMatches, 'matches,', deletedStreams, 'streams');
