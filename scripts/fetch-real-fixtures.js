const https = require('https');
const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

const API_URL = 'https://api.football-data.org/v4/matches';
const PRE_MATCH_HOURS = 4;
const UPCOMING_DAYS = 7;

function fetchJSON(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, (res) => {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchFixtures() {
  console.log('Fetching from API...');
  try {
    const data = await fetchJSON(API_URL);
    const fixtures = [];
    if (data.matches && Array.isArray(data.matches)) {
      for (const m of data.matches) {
        if (m.status.type === 'SCHEDULED' || m.status.type === 'INPLAY' || m.status.type === 'TIMED') {
          fixtures.push({
            home_team: m.homeTeam?.name || 'Unknown',
            away_team: m.awayTeam?.name || 'Unknown',
            league: m.competition?.name || 'Football',
            match_time: m.utcDate,
            status: m.status.type === 'INPLAY' ? 'live' : 'scheduled'
          });
        }
      }
    }
    console.log('Found', fixtures.length, 'fixtures');
    return fixtures;
  } catch (err) {
    console.log('API failed:', err.message);
    return [];
  }
}

function isWithinPreMatch(isoTime) {
  const now = new Date();
  const matchTime = new Date(isoTime);
  const diffHours = (matchTime - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= PRE_MATCH_HOURS;
}

function isWithinNextDays(isoTime, days) {
  const now = new Date();
  const matchTime = new Date(isoTime);
  const diffHours = (matchTime - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= (days * 24);
}

function addStreams(matchId, home, away, league) {
  const streams = [
    { name: 'Alkass Two', url: 'https://liveeu-gcp.alkassdigital.net/alkass2-p/main.m3u8' },
    { name: 'Alkass Three', url: 'https://liveeu-gcp.alkassdigital.net/alkass3-p/main.m3u8' }
  ];
  for (const s of streams) {
    db.prepare('INSERT INTO streams (match_id, source_name, stream_url, quality, language, is_working, type, note) VALUES (?,?,?,?,?,?,?,?)')
      .run(matchId, s.name, s.url, 'FHD', 'AR/EN', 1, 'hls', home + ' vs ' + away);
  }
  console.log('  Added 2 streams for', home, 'vs', away);
}

function updateDatabase(fixtures) {
  console.log('Processing...');
  
  // Clear ALL old matches first (start fresh)
  db.exec('DELETE FROM streams');
  db.exec('DELETE FROM matches');
  console.log('Cleared old matches');
  
  const now = new Date();
  let liveCount = 0, upcomingCount = 0, streamsAdded = 0;
  
  for (const f of fixtures) {
    // Only process if within next 7 days
    if (!isWithinNextDays(f.match_time, UPCOMING_DAYS)) {
      continue;
    }
    
    const result = db.prepare('INSERT INTO matches (home_team, away_team, league, match_date, status) VALUES (?,?,?,?,?)')
      .run(f.home_team, f.away_team, f.league, f.match_time, f.status);
    
    const matchId = result.lastInsertRowid;
    
    if (f.status === 'live') {
      liveCount++;
      console.log('🔴 LIVE:', f.home_team, 'vs', f.away_team);
      // Add streams immediately for LIVE matches
      addStreams(matchId, f.home_team, f.away_team, f.league);
      streamsAdded++;
    } else if (isWithinPreMatch(f.match_time)) {
      upcomingCount++;
      console.log('⏰ Upcoming (H-4):', f.home_team, 'vs', f.away_team, '-', f.match_time.split('T')[0]);
      // Add streams H-4 before kickoff
      addStreams(matchId, f.home_team, f.away_team, f.league);
      streamsAdded++;
    } else {
      upcomingCount++;
      console.log('📅 Upcoming:', f.home_team, 'vs', f.away_team, '-', f.match_time.split('T')[0]);
      // No streams yet (wait until H-4)
    }
  }
  
  console.log('');
  console.log('🔴 LIVE NOW:', liveCount);
  console.log('📅 NEXT 7 DAYS:', upcomingCount);
  console.log('📺 Streams added:', streamsAdded);
}

const db = Database;
console.log('');
console.log('Real Fixture Fetcher');
console.log('Live window: Currently LIVE only');
console.log('Upcoming window: Next', UPCOMING_DAYS, 'days');
console.log('Pre-match streams: H-' + PRE_MATCH_HOURS + ' hours');
console.log('');

fetchFixtures().then(fixtures => {
  updateDatabase(fixtures);
  console.log('Done!');
});
