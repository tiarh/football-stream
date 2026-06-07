/**
 * Auto-fetch REAL football fixtures from free APIs
 * Updates database daily with actual matches
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DB_PATH = '/root/football-stream/data/football.db';
const Database = require('better-sqlite3')(DB_PATH);

// Free football APIs
const APIS = [
  {
    name: 'Football-Data.org',
    url: 'https://api.football-data.org/v4/matches',
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '' },
    parse: parseFootballData
  },
  {
    name: 'TheSportsDB',
    url: 'https://www.thesportsdb.com/api/v1/json/3/eventsmetadata.php?date=2026-06-07',
    headers: {},
    parse: parseTheSportsDB
  }
];

function getDate() {
  return new Date().toISOString().split('T')[0];
}

function fetchJSON(url, headers = {}, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = { timeout, headers };
    
    const req = protocol.get(url, options, (res) => {
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

function parseFootballData(data) {
  const fixtures = [];
  
  // football-data.org returns { matches: [...] }
  if (data.matches && Array.isArray(data.matches)) {
    for (const match of data.matches) {
      if (match.status.type === 'SCHEDULED' || match.status.type === 'INPLAY') {
        fixtures.push({
          home_team: match.homeTeam?.name || match.homeTeam?.team?.name,
          away_team: match.awayTeam?.name || match.awayTeam?.team?.name,
          league: match.competition?.name || 'Unknown',
          match_time: match.utcDate,
          status: match.status.type === 'INPLAY' ? 'live' : 'scheduled',
          home_score: match.score?.fullTime?.home,
          away_score: match.score?.fullTime?.away,
        });
      }
    }
  }
  
  return fixtures;
}

function parseTheSportsDB(data) {
  const fixtures = [];
  
  if (data.events && Array.isArray(data.events)) {
    for (const event of data.events) {
      fixtures.push({
        home_team: event.strHomeTeam,
        away_team: event.strAwayTeam,
        league: event.strLeague,
        match_time: event.dateEvent + 'T' + event.strTime,
        status: event.strStatus === 'Match Finished' ? 'finished' : 'scheduled',
        home_score: event.intHomeScore,
        away_score: event.intAwayScore,
      });
    }
  }
  
  return fixtures;
}

async function fetchFixtures() {
  const today = getDate();
  console.log(`📅 Fetching fixtures for ${today}...\n`);
  
  const allFixtures = [];
  
  for (const api of APIS) {
    try {
      console.log(`🔍 Trying ${api.name}...`);
      
      const data = await fetchJSON(api.url, api.headers);
      const fixtures = api.parse(data);
      
      if (fixtures.length > 0) {
        console.log(`✓ Found ${fixtures.length} fixtures from ${api.name}\n`);
        allFixtures.push(...fixtures);
      } else {
        console.log(`ℹ️ No fixtures from ${api.name}\n`);
      }
    } catch (err) {
      console.log(`✗ ${api.name} failed: ${err.message}\n`);
    }
  }
  
  // Remove duplicates
  const unique = [];
  const seen = new Set();
  for (const f of allFixtures) {
    const key = `${f.home_team} vs ${f.away_team}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(f);
    }
  }
  
  console.log(`📊 Total unique fixtures: ${unique.length}\n`);
  return unique;
}

function updateDatabase(fixtures) {
  console.log('📊 Updating database...\n');
  
  if (fixtures.length === 0) {
    console.log('ℹ️ No fixtures today - clearing old live matches');
    const result = Database.prepare(`
      UPDATE matches SET status = 'finished' 
      WHERE status = 'live'
    `).run();
    console.log(`✓ Cleared ${result.changes} old live matches`);
    return;
  }
  
  let added = 0;
  let updated = 0;
  
  for (const fixture of fixtures) {
    // Check if exists
    let match = Database.prepare(`
      SELECT id FROM matches 
      WHERE home_team = ? AND away_team = ?
    `).get(fixture.home_team, fixture.away_team);
    
    if (match) {
      // Update
      Database.prepare(`
        UPDATE matches 
        SET status = ?, match_date = ?, league = ?, home_score = ?, away_score = ?
        WHERE id = ?
      `).run(
        fixture.status,
        fixture.match_time,
        fixture.league,
        fixture.home_score || null,
        fixture.away_score || null,
        match.id
      );
      updated++;
      console.log(`🔄 ${fixture.home_team} vs ${fixture.away_team} (${fixture.status})`);
    } else {
      // Insert
      const result = Database.prepare(`
        INSERT INTO matches (home_team, away_team, league, match_date, status, home_score, away_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        fixture.home_team,
        fixture.away_team,
        fixture.league,
        fixture.match_time,
        fixture.status,
        fixture.home_score || null,
        fixture.away_score || null
      );
      
      added++;
      console.log(`➕ ${fixture.home_team} vs ${fixture.away_team} (${fixture.league})`);
      
      // Add 2 verified streams per match
      const matchId = result.lastInsertRowid;
      addMatchStreams(matchId, fixture.home_team, fixture.away_team);
    }
  }
  
  console.log(`\n✅ Database updated!`);
  console.log(`   ➕ Added: ${added}`);
  console.log(`   🔄 Updated: ${updated}`);
}

function addMatchStreams(matchId, homeTeam, awayTeam) {
  // Use 2 verified Alkass streams (they show various matches)
  const streams = [
    {
      name: 'Alkass Two - Live',
      url: 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8',
      quality: 'FHD',
      lang: 'AR/EN'
    },
    {
      name: 'Alkass Three - Live',
      url: 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8',
      quality: 'FHD',
      lang: 'AR/EN'
    }
  ];
  
  for (const stream of streams) {
    Database.prepare(`
      INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type, note)
      VALUES (?, ?, ?, ?, ?, 1, 'hls', ?)
    `).run(matchId, stream.name, stream.url, stream.quality, stream.lang, `${homeTeam} vs ${awayTeam}`);
  }
  
  console.log(`   📺 Added 2 streams for ${homeTeam} vs ${awayTeam}`);
}

async function main() {
  try {
    const fixtures = await fetchFixtures();
    updateDatabase(fixtures);
    console.log('\n🎉 Fetch complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
