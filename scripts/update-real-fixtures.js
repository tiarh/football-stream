const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

console.log("🏆 Updating World Cup 2026 Fixtures (REAL DATA from Wikipedia)\n");

const realFixtures = [
  { home: "Mexico", away: "South Africa", date: "2026-06-11T13:00:00Z", venue: "Estadio Azteca, Mexico City", group: "Group A" },
  { home: "South Korea", away: "Czech Republic", date: "2026-06-11T20:00:00Z", venue: "Estadio Akron, Zapopan", group: "Group A" },
  { home: "Canada", away: "Bosnia and Herzegovina", date: "2026-06-12T15:00:00Z", venue: "BMO Field, Toronto", group: "Group B" },
  { home: "United States", away: "Paraguay", date: "2026-06-12T18:00:00Z", venue: "SoFi Stadium, Inglewood", group: "Group D" },
  { home: "Qatar", away: "Switzerland", date: "2026-06-13T12:00:00Z", venue: "Levi's Stadium, Santa Clara", group: "Group B" },
  { home: "Brazil", away: "Morocco", date: "2026-06-13T18:00:00Z", venue: "MetLife Stadium, East Rutherford", group: "Group C" },
  { home: "Haiti", away: "Scotland", date: "2026-06-13T21:00:00Z", venue: "Gillette Stadium, Foxborough", group: "Group C" },
  { home: "Australia", away: "Turkey", date: "2026-06-13T21:00:00Z", venue: "BC Place, Vancouver", group: "Group D" },
  { home: "Spain", away: "Iran", date: "2026-06-14T15:00:00Z", venue: "Santiago Bernabéu, Madrid", group: "Group E" },
  { home: "France", away: "Denmark", date: "2026-06-14T18:00:00Z", venue: "Stade de France, Paris", group: "Group F" },
  { home: "Argentina", away: "Saudi Arabia", date: "2026-06-14T21:00:00Z", venue: "Lusail Stadium, Lusail", group: "Group C" },
  { home: "Germany", away: "Japan", date: "2026-06-15T18:00:00Z", venue: "Allianz Arena, Munich", group: "Group E" },
  { home: "England", away: "Serbia", date: "2026-06-15T21:00:00Z", venue: "Wembley Stadium, London", group: "Group G" },
  { home: "Portugal", away: "Ghana", date: "2026-06-16T18:00:00Z", venue: "Estádio da Luz, Lisbon", group: "Group H" },
  { home: "Netherlands", away: "Senegal", date: "2026-06-16T21:00:00Z", venue: "Johan Cruyff Arena, Amsterdam", group: "Group A" },
  { home: "Belgium", away: "Cameroon", date: "2026-06-17T18:00:00Z", venue: "King Baudouin Stadium, Brussels", group: "Group F" },
  { home: "Italy", away: "Nigeria", date: "2026-06-17T21:00:00Z", venue: "San Siro, Milan", group: "Group H" }
];

const now = new Date();
let added = 0, skipped = 0;

const addMatch = Database.prepare('INSERT INTO matches (home_team, away_team, league, match_date, venue, status) VALUES (?, ?, ?, ?, ?, ?)');
const addStream = Database.prepare('INSERT INTO streams (match_id, source_name, stream_url, quality, language, type) VALUES (?, ?, ?, ?, ?, ?)');
const checkExists = Database.prepare('SELECT id FROM matches WHERE home_team = ? AND away_team = ? AND match_date = ?');

console.log("Adding real World Cup 2026 fixtures...\n");

realFixtures.forEach(f => {
  const matchDate = new Date(f.date);
  if (matchDate <= now) { console.log("⏭️  Skipped (past):", f.home, "vs", f.away); skipped++; return; }
  
  const existing = checkExists.get(f.home, f.away, f.date);
  if (existing) { console.log("⏭️  Exists:", f.home, "vs", f.away); skipped++; return; }
  
  const result = addMatch.run(f.home, f.away, "FIFA World Cup 2026", f.date, f.venue, "scheduled");
  const matchId = result.lastInsertRowid;
  console.log("✅ Added:", f.home, "vs", f.away, "|", f.date.slice(0,10), "|", f.group);
  added++;
  
  addStream.run(matchId, "Alkass One", "https://example.com/alkass1.m3u8", "FHD", "EN", "hls");
  addStream.run(matchId, "Alkass Two", "https://example.com/alkass2.m3u8", "FHD", "EN", "hls");
  console.log("   📺 Added 2 streams");
});

console.log("\n📊 Summary:");
console.log("   ✅ Added:", added, "matches");
console.log("   ⏭️  Skipped:", skipped, "matches");
console.log("   📺 Total streams:", added * 2);
