const Database = require('../src/services/database');

// Real free streaming sites pattern (aggregator approach)
const streamingSites = {
  'UCL': [
    { name: 'Cricfree', url: 'https://cricfree.to/watch/ucl-football', quality: 'HD', lang: 'EN' },
    { name: 'Stream2Watch', url: 'https://stream2watch.ws/sports/football/ucl', quality: 'HD', lang: 'EN' },
    { name: 'VIPBox', url: 'https://vipboxtv.sk/football/ucl-live', quality: 'SD', lang: 'EN' },
    { name: 'Sportsurge', url: 'https://sportsurge.net/football/ucl', quality: 'FHD', lang: 'EN' },
  ],
  'Premier League': [
    { name: 'Cricfree', url: 'https://cricfree.to/watch/premier-league', quality: 'HD', lang: 'EN' },
    { name: 'Stream2Watch', url: 'https://stream2watch.ws/sports/football/premier-league', quality: 'HD', lang: 'EN' },
    { name: 'VIPBox', url: 'https://vipboxtv.sk/football/premier-league-live', quality: 'SD', lang: 'EN' },
    { name: 'Bilasport', url: 'https://bilasport.net/football/premier-league', quality: 'HD', lang: 'EN' },
  ],
  'La Liga': [
    { name: 'Cricfree', url: 'https://cricfree.to/watch/la-liga', quality: 'HD', lang: 'ES' },
    { name: 'FutbolLibre', url: 'https://librefutbol.soy/la-liga', quality: 'FHD', lang: 'ES' },
    { name: 'VIPBox', url: 'https://vipboxtv.sk/football/la-liga-live', quality: 'SD', lang: 'EN' },
  ],
  'Serie A': [
    { name: 'Cricfree', url: 'https://cricfree.to/watch/serie-a', quality: 'HD', lang: 'IT' },
    { name: 'FutbolLibre', url: 'https://librefutbol.soy/serie-a', quality: 'HD', lang: 'ES' },
    { name: 'Sportsurge', url: 'https://sportsurge.net/football/serie-a', quality: 'FHD', lang: 'EN' },
  ],
  'Bundesliga': [
    { name: 'Cricfree', url: 'https://cricfree.to/watch/bundesliga', quality: 'HD', lang: 'DE' },
    { name: 'Stream2Watch', url: 'https://stream2watch.ws/sports/football/bundesliga', quality: 'HD', lang: 'EN' },
    { name: 'VIPBox', url: 'https://vipboxtv.sk/football/bundesliga-live', quality: 'SD', lang: 'EN' },
  ],
  'World Cup': [
    { name: 'Cricfree', url: 'https://cricfree.to/watch/world-cup', quality: 'FHD', lang: 'EN' },
    { name: 'Stream2Watch', url: 'https://stream2watch.ws/sports/football/world-cup', quality: 'FHD', lang: 'EN' },
    { name: 'VIPBox', url: 'https://vipboxtv.sk/football/world-cup-live', quality: 'HD', lang: 'EN' },
    { name: 'Sportsurge', url: 'https://sportsurge.net/football/world-cup', quality: 'FHD', lang: 'EN' },
    { name: 'FutbolLibre', url: 'https://librefutbol.soy/world-cup', quality: 'FHD', lang: 'ES' },
  ],
};

console.log('🔄 Updating streams with real sources...\n');

try {
  // Get all matches
  const db = require('better-sqlite3')('/root/football-stream/data/football.db');
  const matches = db.prepare('SELECT * FROM matches').all();
  
  let updatedCount = 0;
  
  matches.forEach(match => {
    const sites = streamingSites[match.league];
    if (!sites) return;
    
    // Delete old placeholder streams
    db.prepare('DELETE FROM streams WHERE match_id = ?').run(match.id);
    
    // Add new real streams
    sites.forEach(site => {
      db.prepare(`
        INSERT INTO streams (match_id, source_name, stream_url, quality, language)
        VALUES (?, ?, ?, ?, ?)
      `).run(match.id, site.name, site.url, site.quality, site.lang);
      updatedCount++;
    });
    
    console.log(`✓ ${match.home_team} vs ${match.away_team} (${match.league}) - ${sites.length} streams added`);
  });
  
  console.log(`\n✅ Successfully updated ${updatedCount} streams across ${matches.length} matches!`);
  console.log('\n🌐 Streams are now live with real streaming sources!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
