const Database = require('better-sqlite3');

const DB_PATH = '/root/football-stream/data/football.db';
const db = new Database(DB_PATH);

const wcMatches = [
  { home: "Mexico", away: "South Africa", kickoff: "2026-06-11T19:00:00Z" },
  { home: "Korea Republic", away: "Czechia", kickoff: "2026-06-12T02:00:00Z" },
  { home: "Canada", away: "Bosnia and Herzegovina", kickoff: "2026-06-12T17:00:00Z" },
  { home: "United States", away: "Paraguay", kickoff: "2026-06-13T01:00:00Z" },
  { home: "Qatar", away: "Switzerland", kickoff: "2026-06-13T19:00:00Z" },
  { home: "Brazil", away: "Morocco", kickoff: "2026-06-13T22:00:00Z" },
  { home: "Haiti", away: "Scotland", kickoff: "2026-06-14T01:00:00Z" },
  { home: "Australia", away: "Türkiye", kickoff: "2026-06-14T17:00:00Z" },
  { home: "Germany", away: "Curaçao", kickoff: "2026-06-14T17:00:00Z" },
  { home: "Netherlands", away: "Japan", kickoff: "2026-06-14T20:00:00Z" },
  { home: "Côte d'Ivoire", away: "Ecuador", kickoff: "2026-06-14T23:00:00Z" },
  { home: "Sweden", away: "Tunisia", kickoff: "2026-06-15T17:00:00Z" },
  { home: "Spain", away: "Cabo Verde", kickoff: "2026-06-15T17:00:00Z" },
  { home: "Belgium", away: "Egypt", kickoff: "2026-06-15T20:00:00Z" },
  { home: "Saudi Arabia", away: "Uruguay", kickoff: "2026-06-15T23:00:00Z" },
  { home: "IR Iran", away: "New Zealand", kickoff: "2026-06-16T17:00:00Z" },
  { home: "France", away: "Senegal", kickoff: "2026-06-16T20:00:00Z" },
  { home: "Iraq", away: "Norway", kickoff: "2026-06-16T23:00:00Z" },
  { home: "Argentina", away: "Algeria", kickoff: "2026-06-17T17:00:00Z" },
  { home: "Austria", away: "Jordan", kickoff: "2026-06-17T20:00:00Z" },
  { home: "Portugal", away: "DR Congo", kickoff: "2026-06-17T23:00:00Z" },
  { home: "England", away: "Croatia", kickoff: "2026-06-18T01:00:00Z" },
  { home: "Ghana", away: "Panama", kickoff: "2026-06-18T17:00:00Z" },
  { home: "Uzbekistan", away: "Colombia", kickoff: "2026-06-18T20:00:00Z" },
  { home: "Czechia", away: "South Africa", kickoff: "2026-06-18T23:00:00Z" },
  { home: "Switzerland", away: "Bosnia and Herzegovina", kickoff: "2026-06-19T01:00:00Z" },
  { home: "Canada", away: "Qatar", kickoff: "2026-06-19T20:00:00Z" },
  { home: "Mexico", away: "Korea Republic", kickoff: "2026-06-19T23:00:00Z" },
  { home: "United States", away: "Australia", kickoff: "2026-06-20T17:00:00Z" },
  { home: "Scotland", away: "Morocco", kickoff: "2026-06-20T20:00:00Z" },
  { home: "Brazil", away: "Haiti", kickoff: "2026-06-20T23:00:00Z" },
  { home: "Türkiye", away: "Paraguay", kickoff: "2026-06-21T01:00:00Z" },
  { home: "Netherlands", away: "Sweden", kickoff: "2026-06-21T17:00:00Z" },
  { home: "Germany", away: "Côte d'Ivoire", kickoff: "2026-06-21T20:00:00Z" },
  { home: "Ecuador", away: "Curaçao", kickoff: "2026-06-21T23:00:00Z" },
  { home: "Tunisia", away: "Japan", kickoff: "2026-06-22T17:00:00Z" },
  { home: "Spain", away: "Saudi Arabia", kickoff: "2026-06-22T20:00:00Z" },
  { home: "Belgium", away: "IR Iran", kickoff: "2026-06-22T23:00:00Z" },
  { home: "Uruguay", away: "Cabo Verde", kickoff: "2026-06-23T01:00:00Z" },
  { home: "New Zealand", away: "Egypt", kickoff: "2026-06-23T17:00:00Z" },
  { home: "Argentina", away: "Austria", kickoff: "2026-06-23T20:00:00Z" },
  { home: "France", away: "Iraq", kickoff: "2026-06-23T23:00:00Z" },
  { home: "Norway", away: "Senegal", kickoff: "2026-06-24T01:00:00Z" },
  { home: "Jordan", away: "Algeria", kickoff: "2026-06-24T17:00:00Z" },
  { home: "Portugal", away: "Uzbekistan", kickoff: "2026-06-24T20:00:00Z" },
  { home: "England", away: "Ghana", kickoff: "2026-06-24T23:00:00Z" },
  { home: "Panama", away: "Croatia", kickoff: "2026-06-25T01:00:00Z" },
  { home: "Colombia", away: "DR Congo", kickoff: "2026-06-25T17:00:00Z" },
  { home: "Switzerland", away: "Canada", kickoff: "2026-06-25T20:00:00Z" },
  { home: "Bosnia and Herzegovina", away: "Qatar", kickoff: "2026-06-25T23:00:00Z" },
  { home: "Morocco", away: "Haiti", kickoff: "2026-06-26T01:00:00Z" },
  { home: "Scotland", away: "Brazil", kickoff: "2026-06-26T17:00:00Z" },
  { home: "Czechia", away: "Mexico", kickoff: "2026-06-26T20:00:00Z" },
  { home: "South Africa", away: "Korea Republic", kickoff: "2026-06-26T23:00:00Z" },
  { home: "Ecuador", away: "Germany", kickoff: "2026-06-27T17:00:00Z" },
  { home: "Curaçao", away: "Côte d'Ivoire", kickoff: "2026-06-27T20:00:00Z" },
  { home: "Japan", away: "Sweden", kickoff: "2026-06-27T23:00:00Z" },
  { home: "Tunisia", away: "Netherlands", kickoff: "2026-06-28T01:00:00Z" },
  { home: "Paraguay", away: "Australia", kickoff: "2026-06-28T17:00:00Z" },
  { home: "Türkiye", away: "United States", kickoff: "2026-06-28T20:00:00Z" },
  { home: "Norway", away: "France", kickoff: "2026-06-28T23:00:00Z" },
  { home: "Senegal", away: "Iraq", kickoff: "2026-06-29T01:00:00Z" },
  { home: "Cabo Verde", away: "Saudi Arabia", kickoff: "2026-06-29T17:00:00Z" },
  { home: "Uruguay", away: "Spain", kickoff: "2026-06-29T20:00:00Z" },
  { home: "Egypt", away: "IR Iran", kickoff: "2026-06-29T23:00:00Z" },
  { home: "New Zealand", away: "Belgium", kickoff: "2026-06-30T01:00:00Z" },
  { home: "Panama", away: "England", kickoff: "2026-06-30T17:00:00Z" },
  { home: "Colombia", away: "Portugal", kickoff: "2026-06-30T20:00:00Z" },
  { home: "DR Congo", away: "Uzbekistan", kickoff: "2026-06-30T23:00:00Z" },
  { home: "Jordan", away: "Argentina", kickoff: "2026-07-01T01:00:00Z" },
  { home: "Croatia", away: "Ghana", kickoff: "2026-07-01T17:00:00Z" },
  { home: "Algeria", away: "Austria", kickoff: "2026-07-01T20:00:00Z" },
];

const deleteOld = db.prepare("DELETE FROM matches WHERE league = 'FIFA World Cup 2026'");
const deleted = deleteOld.run();
console.log(`Deleted ${deleted.changes} old matches`);

const insert = db.prepare(`
  INSERT INTO matches (home_team, away_team, match_date, league, status)
  VALUES (?, ?, ?, 'FIFA World Cup 2026', 'scheduled')
`);

const insertMany = db.transaction((matches) => {
  for (const match of matches) {
    insert.run(match.home, match.away, match.kickoff);
  }
});

insertMany(wcMatches);
console.log(`Inserted ${wcMatches.length} matches`);

const count = db.prepare("SELECT COUNT(*) as cnt FROM matches WHERE league = 'FIFA World Cup 2026'").get();
console.log(`Total in DB: ${count.cnt}`);

// Show first 10
const rows = db.prepare("SELECT home_team, away_team, match_date FROM matches WHERE league = 'FIFA World Cup 2026' ORDER BY match_date LIMIT 10").all();
console.log('First 10:');
rows.forEach(r => console.log(`  ${r.match_date}  ${r.home_team} vs ${r.away_team}`));

db.close();
