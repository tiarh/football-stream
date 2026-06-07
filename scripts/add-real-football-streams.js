const Database = require('../src/services/database');

// Real football streaming sources - Legal & Free
// Mix of YouTube live channels, official platforms, and free-to-air
const footballStreams = {
  'UCL': [
    { name: 'UEFA.tv Official', url: 'https://www.uefa.com/uefachampionsleague/', quality: 'FHD', lang: 'EN', type: 'link', note: 'Official UCL highlights + some live' },
    { name: 'CBS Sports Golazo', url: 'https://www.youtube.com/@CBSSportsGolazo247', quality: 'HD', lang: 'EN', type: 'link', note: '24/7 football channel' },
    { name: 'Paramount+ Free', url: 'https://www.paramountplus.com/', quality: 'FHD', lang: 'EN', type: 'link', note: 'UCL broadcaster (free trial)' },
  ],
  'Premier League': [
    { name: 'NBC Sports', url: 'https://www.nbcsports.com/soccer', quality: 'FHD', lang: 'EN', type: 'link', note: 'Official US broadcaster' },
    { name: 'Sky Sports Football', url: 'https://www.youtube.com/@SkySportsFootball', quality: 'HD', lang: 'EN', type: 'link', note: 'Highlights + press conferences' },
    { name: 'OneFootball', url: 'https://onefootball.com/', quality: 'HD', lang: 'EN', type: 'link', note: 'Free live matches (select regions)' },
  ],
  'La Liga': [
    { name: 'LaLiga+ Official', url: 'https://www.laliga.com/en-GB/laliga-plus', quality: 'FHD', lang: 'ES', type: 'link', note: 'Official LaLiga streaming' },
    { name: 'Real Madrid TV', url: 'https://www.realmadrid.com/en-GB/live', quality: 'HD', lang: 'ES', type: 'link', note: 'Official club channel' },
    { name: 'FC Barcelona TV', url: 'https://www.fcbarcelona.com/en/football/first-team/live', quality: 'HD', lang: 'ES', type: 'link', note: 'Official club channel' },
  ],
  'Serie A': [
    { name: 'Serie A Official', url: 'https://www.legaseriea.it/en/', quality: 'HD', lang: 'IT', type: 'link', note: 'Official highlights' },
    { name: 'OneFootball', url: 'https://onefootball.com/', quality: 'HD', lang: 'EN', type: 'link', note: 'Free Serie A streams' },
  ],
  'Bundesliga': [
    { name: 'Bundesliga Official', url: 'https://www.bundesliga.com/en/bundesliga/live', quality: 'FHD', lang: 'DE', type: 'link', note: 'Official Bundesliga streams' },
    { name: 'Bayern Munich TV', url: 'https://fcbayern.com/en/video', quality: 'HD', lang: 'DE', type: 'link', note: 'Official club content' },
  ],
  'World Cup': [
    { name: 'FIFA+ Official', url: 'https://plus.fifa.com/', quality: 'FHD', lang: 'EN', type: 'link', note: 'FREE World Cup archive + live' },
    { name: 'beIN Sports', url: 'https://www.beinsports.com/', quality: 'FHD', lang: 'EN', type: 'link', note: 'Official broadcaster' },
    { name: 'OneFootball', url: 'https://onefootball.com/', quality: 'HD', lang: 'EN', type: 'link', note: 'Free World Cup streams' },
  ],
};

// Test HLS streams (always working, for demo)
const testStreams = [
  { name: 'NFL Channel (Test)', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', quality: 'HD', lang: 'EN', type: 'hls', note: 'Demo stream' },
];

console.log('🔄 Updating with REAL football streaming sources...\n');

try {
  const db = require('better-sqlite3')('/root/football-stream/data/football.db');
  const matches = db.prepare('SELECT * FROM matches').all();
  
  let updatedCount = 0;
  
  matches.forEach(match => {
    const sources = footballStreams[match.league] || footballStreams['Premier League'];
    
    // Delete old streams
    db.prepare('DELETE FROM streams WHERE match_id = ?').run(match.id);
    
    // Add real football sources
    sources.forEach(source => {
      db.prepare(`
        INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(match.id, source.name, source.url, source.quality, source.lang, source.type);
      updatedCount++;
    });
    
    // Add test stream
    testStreams.forEach(test => {
      db.prepare(`
        INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(match.id, test.name, test.url, test.quality, test.lang, test.type);
      updatedCount++;
    });
    
    console.log(`✓ ${match.home_team} vs ${match.away_team} - ${sources.length + 1} streams`);
  });
  
  console.log(`\n✅ Updated ${updatedCount} streams with REAL football sources!`);
  console.log('\n📺 Sources include:');
  console.log('   - UEFA.tv (official UCL)');
  console.log('   - FIFA+ (free World Cup)');
  console.log('   - OneFootball (free live matches)');
  console.log('   - LaLiga+ (official La Liga)');
  console.log('   - Bundesliga Official');
  console.log('   - NBC Sports / Sky Sports');
  console.log('   - Club TV channels (Real Madrid, Barca, Bayern)');
  console.log('\n⚠️ Note: Some streams require free account or are region-locked');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
