const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const Database = require('./services/database');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 8084;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Team name normalization: DB names → Polymarket names
const TEAM_ALIAS = {
  'South Korea': 'Korea Republic',
  'Czech Republic': 'Czechia',
  'T\u00fcrkiye': 'T\u00fcrkiye',
};

// Build match odds lookup (keyed by both orderings)
const polyMatchOdds = {};
try {
  const raw = fs.readFileSync(ODDS_FILE, 'utf8');
  const data = JSON.parse(raw);
  for (const [slug, o] of Object.entries(data.odds || {})) {
    const home = o.home || '', away = o.away || '';
    if (!home || !away) continue;
    // Key by Polymarket names (exact)
    polyMatchOdds[`${home} vs ${away}`] = o;
    // Also key by swapped (for lookup when DB order differs)
    polyMatchOdds[`${away} vs ${home}`] = o;
  }
  console.log(`\uD83D\uDCCA Loaded match odds for ${Object.keys(data.odds || {}).length} matches`);
} catch (e) {
  console.log('\u26A0\uFE0F  No match odds cache found, run: node scripts/fetch-poly-match-odds.js');
}

// Refresh odds cache from Polymarket (call this periodically)
async function refreshMatchOdds() {
  const { spawn } = require('child_process');
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(__dirname, '../scripts/fetch-poly-match-odds.js')], { detached: true });
    child.on('close', resolve);
  });
}

// Home - Live + Upcoming + Match Odds
app.get('/', (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const liveMatches = Database.getLiveMatches();
    
    const allUpcoming = Database.getUpcomingMatches();
    const upcomingMatches = allUpcoming.filter(m => {
      const matchDate = new Date(m.match_date);
      return matchDate > now && matchDate <= sevenDaysLater && m.status !== 'live';
    });
    
    upcomingMatches.forEach(match => {
      const streams = Database.getStreamsByMatchId(match.id);
      match.streams = streams;
      // Attach Polymarket 3-way match odds (normalize team names)
      const dbHome = match.home_team;
      const dbAway = match.away_team;
      const homeNorm = TEAM_ALIAS[dbHome] || dbHome;
      const awayNorm = TEAM_ALIAS[dbAway] || dbAway;
      const key1 = `${homeNorm} vs ${awayNorm}`;
      const key2 = `${awayNorm} vs ${homeNorm}`;
      match.odds = polyMatchOdds[key1] || polyMatchOdds[key2] || null;
    });
    
    res.render('index', {
      liveMatches,
      upcomingMatches,
      pageTitle: 'Football Stream'
    });
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('index', {
      liveMatches: [],
      upcomingMatches: [],
      pageTitle: 'Football Stream',
      error: 'Failed to load matches'
    });
  }
});

// Match detail
app.get('/match/:id', (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = Database.getMatchById(matchId);
    if (!match) return res.status(404).send('Match not found');
    const streams = Database.getStreamsByMatchId(matchId);
    res.render('match', { match, streams });
  } catch (err) {
    console.error('Match detail error:', err);
    res.status(500).send('Server error');
  }
});

// Vote stream
app.post('/api/vote', (req, res) => {
  try {
    const { streamId, value } = req.body;
    Database.voteStream(streamId, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Report stream
app.post('/api/report', (req, res) => {
  try {
    const { streamId, reason } = req.body;
    Database.reportStream(streamId, reason);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report' });
  }
});

// API: Get WC 2026 match odds (from local cache, refreshed hourly)
app.get('/api/odds/match', (req, res) => {
  try {
    const raw = fs.readFileSync(ODDS_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json({ updatedAt: data.updatedAt, source: 'polymarket.com/sports/world-cup/games', matchCount: data.matchCount, odds: data.odds });
  } catch (err) {
    res.status(500).json({ error: 'No match odds available' });
  }
});

// API: Force refresh odds from Polymarket
app.get('/api/odds/refresh', async (req, res) => {
  try {
    await refreshMatchOdds();
    // Reload cache
    try {
      const raw = fs.readFileSync(ODDS_FILE, 'utf8');
      const data = JSON.parse(raw);
      const newOdds = {};
      for (const [slug, o] of Object.entries(data.odds || {})) {
        const home = o.home, away = o.away;
        if (home && away) {
          newOdds[`${home} vs ${away}`] = o;
          newOdds[`${away} vs ${home}`] = o;
        }
      }
      polyMatchOdds = newOdds;
    } catch (e) { /* ignore */ }
    res.json({ success: true, message: 'Odds refreshed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats dashboard
app.use('/stats', statsRouter);

// Redirects
app.get('/live', (req, res) => res.redirect('/#live-now'));
app.get('/upcoming', (req, res) => res.redirect('/#next-7-days'));
app.get('/next', (req, res) => res.redirect('/#next-7-days'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database
Database.init();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Football Stream running on port ${PORT}`);
  console.log(`📺 Live + Upcoming (7 days)`);
  console.log(`📊 Stats: http://localhost:${PORT}/stats`);
  console.log(`🔗 http://localhost:${PORT}`);
});