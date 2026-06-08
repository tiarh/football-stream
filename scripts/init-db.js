const Database = require('../src/services/database');

// Sample upcoming matches (realistic fixtures)
const sampleMatches = [
  // UCL
  { home: 'Real Madrid', away: 'Manchester City', league: 'UCL', date: '2026-06-10 20:00', stadium: 'Santiago Bernabéu' },
  { home: 'Bayern Munich', away: 'Arsenal', league: 'UCL', date: '2026-06-10 20:00', stadium: 'Allianz Arena' },
  { home: 'Barcelona', away: 'PSG', league: 'UCL', date: '2026-06-11 20:00', stadium: 'Camp Nou' },
  { home: 'Inter Milan', away: 'Atletico Madrid', league: 'UCL', date: '2026-06-11 20:00', stadium: 'San Siro' },
  
  // Premier League
  { home: 'Liverpool', away: 'Manchester United', league: 'Premier League', date: '2026-06-08 16:30', stadium: 'Anfield' },
  { home: 'Arsenal', away: 'Chelsea', league: 'Premier League', date: '2026-06-08 14:00', stadium: 'Emirates Stadium' },
  { home: 'Manchester City', away: 'Tottenham', league: 'Premier League', date: '2026-06-09 16:30', stadium: 'Etihad Stadium' },
  { home: 'Newcastle', away: 'Aston Villa', league: 'Premier League', date: '2026-06-09 14:00', stadium: "St James' Park" },
  
  // La Liga
  { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', date: '2026-06-15 20:00', stadium: 'Santiago Bernabéu' },
  { home: 'Atletico Madrid', away: 'Sevilla', league: 'La Liga', date: '2026-06-14 18:00', stadium: 'Wanda Metropolitano' },
  
  // Serie A
  { home: 'AC Milan', away: 'Inter Milan', league: 'Serie A', date: '2026-06-12 19:45', stadium: 'San Siro' },
  { home: 'Juventus', away: 'Napoli', league: 'Serie A', date: '2026-06-13 19:45', stadium: 'Allianz Stadium' },
  
  // Bundesliga
  { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga', date: '2026-06-13 17:30', stadium: 'Allianz Arena' },
  { home: 'RB Leipzig', away: 'Bayer Leverkusen', league: 'Bundesliga', date: '2026-06-14 14:30', stadium: 'Red Bull Arena' },
  
  // World Cup 2026 (June-July)
  { home: 'Brazil', away: 'Argentina', league: 'World Cup 2026', date: '2026-06-20 20:00', stadium: 'MetLife Stadium' },
  { home: 'France', away: 'Germany', league: 'World Cup 2026', date: '2026-06-21 20:00', stadium: 'AT&T Stadium' },
  { home: 'Spain', away: 'England', league: 'World Cup 2026', date: '2026-06-22 17:00', stadium: 'Mercedes-Benz Stadium' },
  { home: 'Italy', away: 'Netherlands', league: 'World Cup 2026', date: '2026-06-22 20:00', stadium: 'SoFi Stadium' },
];

// Sample stream sources (aggregator pattern - links would be scraped/added)
const sampleStreams = [
  { source: 'StreamHD', quality: 'HD', lang: 'EN' },
  { source: 'FootballLive', quality: 'FHD', lang: 'EN' },
  { source: 'SportStream', quality: 'HD', lang: 'ES' },
  { source: 'LiveSoccer', quality: 'SD', lang: 'EN' },
  { source: 'FootyBite', quality: 'HD', lang: 'EN' },
];

console.log('📥 Initializing football database...');

try {
  // Add matches
  sampleMatches.forEach(match => {
    const result = Database.addMatch(match.home, match.away, match.league, match.date, match.stadium);
    console.log(`✓ Added: ${match.home} vs ${match.away} (${match.league})`);
    
    // Add 2-3 sample streams per match
    const numStreams = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numStreams; i++) {
      const stream = sampleStreams[Math.floor(Math.random() * sampleStreams.length)];
      // Placeholder URLs - in production these would be real scraped links
      const placeholderUrl = `https://example-stream.com/watch?match=${result.lastInsertRowid}&source=${i}`;
      Database.addStream(result.lastInsertRowid, stream.source, placeholderUrl, stream.quality, stream.lang);
    }
  });

  console.log('\n✅ Database initialized successfully!');
  console.log(`📊 Added ${sampleMatches.length} matches with streams`);
  console.log('\n🌐 Start server: npm start');
} catch (err) {
  console.error('❌ Error initializing database:', err.message);
  process.exit(1);
}
