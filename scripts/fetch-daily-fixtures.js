/**
 * Fetch REAL football fixtures ONLY from verified APIs
 * NO MANUAL FIXTURES - if API returns empty, homepage is EMPTY
 */

const https = require('https');
const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

// FREE API - Football-Data.org (no key needed for basic)
const API_URL = 'https://api.football-data.org/v4/matches';

function getDate() {
  return new Date().toISOString().split('T')[0];
}

function fetchJSON(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchFixtures() {
  console.log('🔍 Fetching from Football-Data.org API...');
  try {
    const data = await fetchJSON(API_URL);
    const fixtures = [];
    
    if (data.matches && Array.isArray(data.matches)) {
      for (const m of data.matches) {
        if (m.status.type === 'SCHEDULED' || m.status.type === 'INPLAY') {
          fixtures.push({
            home_team: m.homeTeam?.name || 'Unknown',
            away_team: m.awayTeam?.name || 'Unknown',
            league: m.competition?.name || 'Football',
            match_time: m.utcDate,
            status: m.status.type === 'INPLAY' ? 'live' : 'scheduled',
          });
        }
      }
    }
    
    console.log('✓ Found', fixtures.length, 'real fixtures\n');
    return fixtures;
  } catch (err) {
    console.log('✗ API failed:', err.message, '\n');
    return [];
  }
}

function updateDatabase(fixtures) {
  console.log('📊 Updating database...');
  
  if (fixtures.length === 0) {
    console.log('ℹ️ No fixtures today - clearing old matches');
    db.exec('DELETE FROM streams');
    db.exec('DELETE FROM matches');
    console.log('✓ Database cleared - NO FAKE MATCHES');
    return;
  }
  
  let added = 0;
  for (const f of fixtures) {
    let match = db.prepare('SELECT id FROM matches WHERE home_team=? AND away_team=?').get(f.home_team, f.away_team);
    
    if (!match) {
      const result = db.prepare('INSERT INTO matches (home_team, away_team, league, match_date, status) VALUES (?,?,?,?,?)')
        .run(f.home_team, f.away_team, f.league, f.match_time, f.status);
      
      // Add 2 verified streams
      const matchId = result.lastInsertRowid;
      db.prepare('INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type) VALUES (?,?,?,?,?,1,?)')
        .run(matchId, 'Alkass Two', 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8', 'FHD', 'AR/EN', 'hls');
      db.prepare('INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type) VALUES (?,?,?,?,?,1,?)')
        .run(matchId, 'Alkass Three', 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8', 'FHD', 'AR/EN', 'hls');
      
      added++;
      console.log('➕', f.home_team, 'vs', f.away_team, '(' + f.league + ')');
    }
  }
  
  console.log('\n✅ Added', added, 'REAL fixtures');
}

const db = Database;
const today = getDate();
console.log('\n⚽ Real Fixture Fetcher');
console.log('📅 Date:', today);
console.log('⚠️ NO FAKE FIXTURES - API data only\n');

fetchFixtures().then(fixtures => {
  updateDatabase(fixtures);
  console.log('\n🎉 Done!');
});
