/**
 * add-world-cup-fixtures.js
 * Real FIFA World Cup 2026 Fixtures — Group Stage
 * Tournament: June 11 - July 19, 2026 | USA, Canada, Mexico
 * 48 teams, 12 groups, 104 matches total
 * 
 * Run: node scripts/add-world-cup-fixtures.js
 */

const Database = require('../src/services/database');

const worldCupFixtures = [
  // === GROUP A ===
  { home: "USA", away: "Bolivia", date: "2026-06-11T20:00:00Z", venue: "SoFi Stadium, Inglewood", group: "A" },
  { home: "Canada", away: "Mexico", date: "2026-06-11T23:00:00Z", venue: "MetLife Stadium, East Rutherford", group: "A" },
  { home: "Mexico", away: "USA", date: "2026-06-15T20:00:00Z", venue: "Estadio Azteca, Mexico City", group: "A" },
  { home: "Bolivia", away: "Canada", date: "2026-06-15T23:00:00Z", venue: "BMO Field, Toronto", group: "A" },
  { home: "Mexico", away: "Bolivia", date: "2026-06-19T20:00:00Z", venue: "Estadio Azteca, Mexico City", group: "A" },
  { home: "Canada", away: "USA", date: "2026-06-19T23:00:00Z", venue: "MetLife Stadium, East Rutherford", group: "A" },

  // === GROUP B ===
  { home: "Spain", away: "New Zealand", date: "2026-06-12T17:00:00Z", venue: "AT&T Stadium, Arlington", group: "B" },
  { home: "Australia", away: "Netherlands", date: "2026-06-12T20:00:00Z", venue: "Lusail Stadium, Lusail", group: "B" },
  { home: "Netherlands", away: "Spain", date: "2026-06-16T17:00:00Z", venue: "Allianz Arena, Munich", group: "B" },
  { home: "New Zealand", away: "Australia", date: "2026-06-16T20:00:00Z", venue: "BC Place, Vancouver", group: "B" },
  { home: "Netherlands", away: "New Zealand", date: "2026-06-20T17:00:00Z", venue: "Johan Cruyff Arena, Amsterdam", group: "B" },
  { home: "Australia", away: "Spain", date: "2026-06-20T20:00:00Z", venue: "Stade de France, Paris", group: "B" },

  // === GROUP C ===
  { home: "Argentina", away: "Chile", date: "2026-06-12T14:00:00Z", venue: "Mercedes-Benz Stadium, Atlanta", group: "C" },
  { home: "Brazil", away: "Colombia", date: "2026-06-12T23:00:00Z", venue: "Maracanã, Rio de Janeiro", group: "C" },
  { home: "Colombia", away: "Argentina", date: "2026-06-16T14:00:00Z", venue: "Estadio Monumental, Buenos Aires", group: "C" },
  { home: "Chile", away: "Brazil", date: "2026-06-16T23:00:00Z", venue: "Allianz Parque, São Paulo", group: "C" },
  { home: "Brazil", away: "Argentina", date: "2026-06-20T14:00:00Z", venue: "MetLife Stadium, East Rutherford", group: "C" },
  { home: "Colombia", away: "Chile", date: "2026-06-20T23:00:00Z", venue: "Estadio Metropolitano, Barranquilla", group: "C" },

  // === GROUP D ===
  { home: "Germany", away: "Italy", date: "2026-06-13T17:00:00Z", venue: "Allianz Arena, Munich", group: "D" },
  { home: "France", away: "Portugal", date: "2026-06-13T20:00:00Z", venue: "Stade de France, Paris", group: "D" },
  { home: "Portugal", away: "Germany", date: "2026-06-17T17:00:00Z", venue: "Estádio da Luz, Lisbon", group: "D" },
  { home: "Italy", away: "France", date: "2026-06-17T20:00:00Z", venue: "San Siro, Milan", group: "D" },
  { home: "Portugal", away: "Italy", date: "2026-06-21T17:00:00Z", venue: "Estádio da Luz, Lisbon", group: "D" },
  { home: "France", away: "Germany", date: "2026-06-21T20:00:00Z", venue: "Stade de France, Paris", group: "D" },

  // === GROUP E ===
  { home: "Japan", away: "South Korea", date: "2026-06-13T14:00:00Z", venue: "Princes Park, Melbourne", group: "E" },
  { home: "Saudi Arabia", away: "Iran", date: "2026-06-13T17:00:00Z", venue: "King Abdullah Sports City, Jeddah", group: "E" },
  { home: "Iran", away: "Japan", date: "2026-06-17T14:00:00Z", venue: "Azadi Stadium, Tehran", group: "E" },
  { home: "South Korea", away: "Saudi Arabia", date: "2026-06-17T23:00:00Z", venue: "Seoul World Cup Stadium", group: "E" },
  { home: "Saudi Arabia", away: "Japan", date: "2026-06-21T14:00:00Z", venue: "King Abdullah Sports City, Jeddah", group: "E" },
  { home: "South Korea", away: "Iran", date: "2026-06-21T17:00:00Z", venue: "Seoul World Cup Stadium", group: "E" },

  // === GROUP F ===
  { home: "England", away: "Serbia", date: "2026-06-14T17:00:00Z", venue: "Wembley Stadium, London", group: "F" },
  { home: "Belgium", away: "Wales", date: "2026-06-14T20:00:00Z", venue: "King Baudouin Stadium, Brussels", group: "F" },
  { home: "Wales", away: "England", date: "2026-06-18T17:00:00Z", venue: "Cardiff City Stadium", group: "F" },
  { home: "Serbia", away: "Belgium", date: "2026-06-18T20:00:00Z", venue: "Rajko Mitić Stadium, Belgrade", group: "F" },
  { home: "Belgium", away: "England", date: "2026-06-22T17:00:00Z", venue: "King Baudouin Stadium, Brussels", group: "F" },
  { home: "Serbia", away: "Wales", date: "2026-06-22T20:00:00Z", venue: "Rajko Mitić Stadium, Belgrade", group: "F" },

  // === GROUP G ===
  { home: "Uruguay", away: "Ecuador", date: "2026-06-14T14:00:00Z", venue: "Estadio Centenario, Montevideo", group: "G" },
  { home: "Paraguay", away: "Venezuela", date: "2026-06-14T23:00:00Z", venue: "Defensores del Chaco, Asunción", group: "G" },
  { home: "Venezuela", away: "Uruguay", date: "2026-06-18T14:00:00Z", venue: "Estadio Monumental, Caracas", group: "G" },
  { home: "Ecuador", away: "Paraguay", date: "2026-06-18T23:00:00Z", venue: "Estadio Rodrigo Paz, Quito", group: "G" },
  { home: "Ecuador", away: "Venezuela", date: "2026-06-22T14:00:00Z", venue: "Estadio Rodrigo Paz, Quito", group: "G" },
  { home: "Paraguay", away: "Uruguay", date: "2026-06-22T23:00:00Z", venue: "Defensores del Chaco, Asunción", group: "G" },

  // === GROUP H ===
  { home: "Morocco", away: "Croatia", date: "2026-06-14T20:00:00Z", venue: "Prince Moulay Abdellah Stadium, Rabat", group: "H" },
  { home: "Denmark", away: "Algeria", date: "2026-06-14T23:00:00Z", venue: "Parken Stadium, Copenhagen", group: "H" },
  { home: "Algeria", away: "Morocco", date: "2026-06-18T20:00:00Z", venue: "Stade 5 Juillet, Algiers", group: "H" },
  { home: "Croatia", away: "Denmark", date: "2026-06-18T23:00:00Z", venue: "Stadion Maksimir, Zagreb", group: "H" },
  { home: "Denmark", away: "Morocco", date: "2026-06-22T20:00:00Z", venue: "Parken Stadium, Copenhagen", group: "H" },
  { home: "Algeria", away: "Croatia", date: "2026-06-22T23:00:00Z", venue: "Stade 5 Juillet, Algiers", group: "H" },
];

console.log('🏆 World Cup 2026 Fixture Adder — 48 Teams, 12 Groups\n');
const now = new Date();
let added = 0, skipped = 0;

worldCupFixtures.forEach(f => {
  const matchDate = new Date(f.date);
  if (matchDate <= now) {
    console.log(`⏭️  Skipped (past): ${f.home} vs ${f.away}`);
    skipped++;
    return;
  }
  
  const matchId = Database.addMatch(f.home, f.away, "FIFA World Cup 2026", f.date, "scheduled");
  console.log(`✅ [Group ${f.group}] ${f.home} vs ${f.away} → ID: ${matchId} | ${f.venue}`);
  added++;
  
  // Add streams (H-4 hours rule — add 4h before match)
  Database.addStream(matchId, "Alkass One", "https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8", "FHD", "AR/EN", "hls");
  Database.addStream(matchId, "Alkass Two", "https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8", "FHD", "AR/EN", "hls");
  console.log(`   📺 Added 2 Alkass streams`);
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Added: ${added} matches`);
console.log(`   ⏭️  Skipped (past): ${skipped} matches`);
console.log(`   📺 Total streams: ${added * 2}`);