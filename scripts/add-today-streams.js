const Database = require('../src/services/database');
const https = require('https');
const http = require('http');

// Test if stream URL is working
function testStream(url, timeout = 5000) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Pre-configured reliable streams (verified working)
// These are updated manually or via cron
const verifiedStreams = [
  {
    name: 'Alkass One',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN'
  },
  {
    name: 'Alkass Two',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN'
  },
  {
    name: 'Alkass Three',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN'
  },
  {
    name: 'Alkass Four',
    url: 'https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8',
    quality: 'FHD',
    lang: 'AR/EN'
  },
  {
    name: 'CBS Sports Golazo',
    url: 'https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d18200298/master.m3u8',
    quality: 'FHD',
    lang: 'EN'
  },
  {
    name: 'FIFA+ Live',
    url: 'https://fifatv.akamaized.net/hls/live/2041454/fifatv/master.m3u8',
    quality: 'FHD',
    lang: 'EN'
  },
  {
    name: 'beIN Sports Haber',
    url: 'https://bein-hls-live.bein.net.tr/bein_sports_haber/live.m3u8',
    quality: 'HD',
    lang: 'TR'
  },
];

// Today's matches (manual update or auto from API)
const todaysMatches = [
  { home: 'Real Madrid', away: 'Manchester City', league: 'UCL' },
  { home: 'Arsenal', away: 'Bayern Munich', league: 'UCL' },
  { home: 'Liverpool', away: 'Manchester United', league: 'Premier League' },
  { home: 'Barcelona', away: 'Atletico Madrid', league: 'La Liga' },
  { home: 'Inter Milan', away: 'AC Milan', league: 'Serie A' },
  { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
];

console.log('🔄 Adding today\'s matches with verified streams...\n');

async function main() {
  try {
    const db = require('better-sqlite3')('/root/football-stream/data/football.db');
    
    // Test streams first
    console.log('🧪 Testing stream URLs...');
    const workingStreams = [];
    for (const stream of verifiedStreams) {
      const isWorking = await testStream(stream.url);
      console.log(`  ${isWorking ? '✓' : '✗'} ${stream.name}`);
      if (isWorking) workingStreams.push(stream);
    }
    
    console.log(`\n✅ ${workingStreams.length}/${verifiedStreams.length} streams working\n`);
    
    if (workingStreams.length === 0) {
      console.log('⚠️ No working streams found!');
      return;
    }
    
    let matchCount = 0;
    let streamCount = 0;
    
    // Add today's matches
    for (const match of todaysMatches) {
      // Check if match exists
      let matchId = db.prepare('SELECT id FROM matches WHERE home_team = ? AND away_team = ?')
        .get(match.home, match.away)?.id;
      
      if (!matchId) {
        // Insert new match
        const result = db.prepare(`
          INSERT INTO matches (home_team, away_team, league, match_date, status)
          VALUES (?, ?, ?, ?, ?)
        `).run(match.home, match.away, match.league, new Date().toISOString(), 'live');
        matchId = result.lastInsertRowid;
        console.log(`➕ Added: ${match.home} vs ${match.away} (${match.league})`);
        matchCount++;
      } else {
        // Update existing
        db.prepare(`
          UPDATE matches SET status = 'live', match_date = ?
          WHERE id = ?
        `).run(new Date().toISOString(), matchId);
        console.log(`🔄 Updated: ${match.home} vs ${match.away}`);
      }
      
      // Delete old streams
      db.prepare('DELETE FROM streams WHERE match_id = ?').run(matchId);
      
      // Add working streams
      for (const stream of workingStreams) {
        db.prepare(`
          INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type)
          VALUES (?, ?, ?, ?, ?, 1, 'hls')
        `).run(matchId, stream.name, stream.url, stream.quality, stream.lang);
        streamCount++;
      }
    }
    
    console.log(`\n✅ Done!`);
    console.log(`   📊 Matches: ${matchCount} added/updated`);
    console.log(`   📺 Streams: ${streamCount} total (${workingStreams.length} per match)`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
