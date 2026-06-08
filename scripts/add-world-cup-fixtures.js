const Database = require('../src/services/database');

const worldCupFixtures = [
  { home: "Mexico", away: "Poland", date: "2026-06-11T18:00:00Z", venue: "Estadio Azteca" },
  { home: "France", away: "Australia", date: "2026-06-11T21:00:00Z", venue: "Stade de France" },
  { home: "Argentina", away: "Saudi Arabia", date: "2026-06-12T18:00:00Z", venue: "Lusail Stadium" },
  { home: "Germany", away: "Japan", date: "2026-06-12T21:00:00Z", venue: "Allianz Arena" },
  { home: "Brazil", away: "Serbia", date: "2026-06-13T18:00:00Z", venue: "Maracana" },
  { home: "Spain", away: "Costa Rica", date: "2026-06-13T21:00:00Z", venue: "Santiago Bernabeu" },
  { home: "England", away: "Iran", date: "2026-06-14T18:00:00Z", venue: "Wembley Stadium" },
  { home: "USA", away: "Wales", date: "2026-06-14T21:00:00Z", venue: "MetLife Stadium" },
  { home: "Portugal", away: "Ghana", date: "2026-06-15T18:00:00Z", venue: "Estadio da Luz" },
  { home: "Netherlands", away: "Senegal", date: "2026-06-15T21:00:00Z", venue: "Johan Cruyff Arena" }
];

console.log("World Cup 2026 Fixture Adder");
const now = new Date();
let added = 0, skipped = 0;

worldCupFixtures.forEach(f => {
  const matchDate = new Date(f.date);
  if (matchDate <= now) { console.log("Skipped (past):", f.home, "vs", f.away); skipped++; return; }
  
  const matchId = Database.addMatch(f.home, f.away, "FIFA World Cup 2026", f.date, "scheduled");
  console.log("Added:", f.home, "vs", f.away, "-> ID:", matchId);
  added++;
  
  Database.addStream(matchId, "Alkass One", "https://example.com/alkass1.m3u8", "FHD", "EN", "hls");
  Database.addStream(matchId, "Alkass Two", "https://example.com/alkass2.m3u8", "FHD", "EN", "hls");
  console.log("  Added 2 streams");
});

console.log("Summary: Added=" + added + ", Skipped=" + skipped + ", Streams=" + (added * 2));
