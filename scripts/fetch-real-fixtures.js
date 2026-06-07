const https = require('https');
const Database = require('better-sqlite3')('/root/football-stream/data/football.db');

const API_URL = 'https://api.football-data.org/v4/matches';
const PRE_MATCH_HOURS = 4;

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
        if (m.status.type === 'SCHEDULED' || m.status.type === 'INPLAY') {
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
  
  // Clear old finished matches (older than 3 hours)
  const clearSql = "DELETE FROM matches WHERE match_date < datetime('now', '-3 hours') AND status = 'finished'";
  db.prepare(clearSql).run();
  db.exec('DELETE FROM streams WHERE match_id NOT IN (SELECT id FROM matches)');
  console.log('Cleared old matches');
  
  let added = 0, streamsAdded = 0;
  
  for (const f of fixtures) {
    let match = db.prepare('SELECT id, status FROM matches WHERE home_team=? AND away_team=?').get(f.home_team, f.away_team);
    
    if (!match) {
      const result = db.prepare('INSERT INTO matches (home_team, away_team, league, match_date, status) VALUES (?,?,?,?,?)')
        .run(f.home_team, f.away_team, f.league, f.match_time, f.status);
      added++;
      console.log('Added:', f.home_team, 'vs', f.away_team, '-', f.match_time.split('T')[0]);
      
      // Add streams if LIVE or within H-4
      if (f.status === 'live' || isWithinPreMatch(f.match_time)) {
        addStreams(result.lastInsertRowid, f.home_team, f.away_team, f.league);
        streamsAdded++;
      }
    } else {
      // Check if need to add streams
      const cnt = db.prepare('SELECT COUNT(*) as c FROM streams WHERE match_id=?').get(match.id).c;
      if (cnt === 0 && (f.status === 'live' || isWithinPreMatch(f.match_time))) {
        addStreams(match.id, f.home_team, f.away_team, f.league);
        streamsAdded++;
      }
      // Update status to live if needed
      if (f.status === 'live' && match.status !== 'live') {
        db.prepare('UPDATE matches SET status=? WHERE id=?').run('live', match.id);
      }
    }
  }
  
  console.log('');
  console.log('New fixtures:', added);
  console.log('Streams added:', streamsAdded);
}

const db = Database;
console.log('');
console.log('Real Fixture Fetcher');
console.log('Pre-match window: H-' + PRE_MATCH_HOURS + ' hours');
console.log('Streams added only when LIVE or within H-4 hours');
console.log('');

fetchFixtures().then(fixtures => {
  updateDatabase(fixtures);
  console.log('Done!');
});
