/**
 * Get REAL football fixtures for today from free APIs
 * Updates database with actual matches happening TODAY
 */

const https = require('https');
const http = require('http');
const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

// Free football API endpoints (no auth required)
const API_ENDPOINTS = [
  // Football-Data.org (free tier)
  'https://api.football-data.org/v4/matches',
  
  // API-Football (requires key, but we'll try)
  'https://v3.football.api-sports.io/fixtures?date=' + new Date().toISOString().split('T')[0],
  
  // Alternative: scrape from RSS feeds
  'https://www.bbc.com/sport/football/scores-fixtures.json',
];

// Fallback: known fixtures for today (update manually or via cron)
// Source: official league websites
const FALLBACK_FIXTURES = [
  // Check actual date - if no real fixtures, don't add fake ones!
];

function getDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getDayName() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

async function fetchJSON(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { timeout }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function getRealFixtures() {
  const today = getDate();
  console.log(`📅 Fetching real fixtures for ${today} (${getDayName()})...\n`);
  
  const fixtures = [];
  
  // Try API-Football (most reliable)
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (apiKey) {
      console.log('🔍 Trying API-Football...');
      const data = await fetchJSON(
        `https://v3.football.api-sports.io/fixtures?date=${today}`,
        { headers: { 'x-apisports-key': apiKey } }
      );
      
      if (data.response && data.response.length > 0) {
        console.log(`✓ Found ${data.response.length} fixtures from API-Football\n`);
        
        for (const match of data.response) {
          fixtures.push({
            home_team: match.teams.home.name,
            away_team: match.teams.away.name,
            league: match.league.name,
            match_time: match.fixture.date,
            status: match.fixture.status.short === 'LIVE' ? 'live' : 'scheduled',
            home_score: match.goals.home,
            away_score: match.goals.away,
          });
        }
      }
    } else {
      console.log('⚠️ No API key - skipping API-Football\n');
    }
  } catch (err) {
    console.log(`✗ API-Football failed: ${err.message}\n`);
  }
  
  // If no fixtures found, check if today is a match day
  // Most leagues play on weekends (Sat/Sun) and some midweek (Tue/Wed)
  const todayDay = getDayName();
  const isMatchDay = ['Saturday', 'Sunday', 'Tuesday', 'Wednesday'].includes(todayDay);
  
  if (fixtures.length === 0 && !isMatchDay) {
    console.log(`ℹ️ Today is ${todayDay} - typically no major fixtures`);
    console.log('💡 Clearing old live matches from database...\n');
    
    // Clear old "live" matches that are no longer valid
    Database.prepare(`
      UPDATE matches SET status = 'finished' 
      WHERE status = 'live' AND match_date < datetime('now', '-3 hours')
    `).run();
    
    return [];
  }
  
  // Fallback: Use pre-configured fixtures for major match days
  // Only use if we're on a weekend and API failed
  if (fixtures.length === 0 && isMatchDay) {
    console.log('⚠️ No API data available - using manual fixture list');
    console.log('💡 Add real fixtures to FALLBACK_FIXTURES in script\n');
    
    // For now, return empty - better to show no matches than fake ones!
    return [];
  }
  
  return fixtures;
}

function updateDatabase(fixtures) {
  console.log(`📊 Updating database with ${fixtures.length} real fixtures...\n`);
  
  if (fixtures.length === 0) {
    // Clear old live matches
    const result = Database.prepare(`
      UPDATE matches SET status = 'finished' 
      WHERE status = 'live'
    `).run();
    
    console.log(`✓ Cleared ${result.changes} old live matches`);
    console.log('ℹ️ No fixtures today - check back later!');
    return;
  }
  
  let added = 0;
  let updated = 0;
  
  for (const fixture of fixtures) {
    // Check if match exists
    let match = Database.prepare(`
      SELECT id FROM matches 
      WHERE home_team = ? AND away_team = ?
    `).get(fixture.home_team, fixture.away_team);
    
    if (match) {
      // Update existing
      Database.prepare(`
        UPDATE matches 
        SET status = ?, match_date = ?, home_score = ?, away_score = ?
        WHERE id = ?
      `).run(
        fixture.status,
        fixture.match_time,
        fixture.home_score,
        fixture.away_score,
        match.id
      );
      updated++;
      console.log(`🔄 Updated: ${fixture.home_team} vs ${fixture.away_team} (${fixture.status})`);
    } else {
      // Insert new
      const result = Database.prepare(`
        INSERT INTO matches (home_team, away_team, league, match_date, status, home_score, away_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        fixture.home_team,
        fixture.away_team,
        fixture.league || 'Unknown',
        fixture.match_time,
        fixture.status,
        fixture.home_score || null,
        fixture.away_score || null
      );
      
      added++;
      console.log(`➕ Added: ${fixture.home_team} vs ${fixture.away_team} (${fixture.league})`);
      
      // Add default streams for this match (Alkass channels)
      const matchId = result.lastInsertRowid;
      const streams = [
        { name: 'Alkass One', url: 'https://liveeu-gcp.alkassdigital.net/alkass1-p/main.m3u8' },
        { name: 'Alkass Two', url: 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8' },
        { name: 'Alkass Three', url: 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8' },
        { name: 'Alkass Four', url: 'https://liveeu-gcp.alkassdigital.net/alkass4-p/main.m3u8' },
      ];
      
      for (const stream of streams) {
        Database.prepare(`
          INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type)
          VALUES (?, ?, ?, 'HD', 'AR/EN', 1, 'hls')
        `).run(matchId, stream.name, stream.url);
      }
    }
  }
  
  console.log(`\n✅ Database updated!`);
  console.log(`   ➕ Added: ${added} matches`);
  console.log(`   🔄 Updated: ${updated} matches`);
}

async function main() {
  try {
    const fixtures = await getRealFixtures();
    updateDatabase(fixtures);
    
    console.log('\n🎉 Schedule update complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
