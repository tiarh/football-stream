const express = require('express');
const path = require('path');
const https = require('https');
const Database = require('./services/database');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 8084;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Fetch WC 2026 winner odds from Polymarket
function fetchPolyOdds() {
  return new Promise((resolve) => {
    const odds = {};
    https.get('https://gamma-api.polymarket.com/markets?tagSlug=sports&limit=500&closed=false', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const markets = JSON.parse(data);
          for (const m of markets) {
            const q = m.question || '';
            if (!q.includes('2026 FIFA World Cup') || !q.includes(' win ')) continue;
            const team = q.replace('Will ', '').replace(' win the 2026 FIFA World Cup?', '').trim();
            const prices = JSON.parse(m.outcomePrices || '[]');
            if (prices.length < 2) continue;
            const yesPrice = parseFloat(prices[0]);
            odds[team] = {
              yesPrice: yesPrice.toFixed(4),
              decimalOdds: yesPrice > 0 ? (1 / yesPrice).toFixed(2) : null,
              impliedProb: (yesPrice * 100).toFixed(1) + '%',
              volume: m.volume,
              slug: m.slug,
            };
          }
        } catch (e) { console.error('Poly odds parse error:', e.message); }
        resolve(odds);
      });
    }).on('error', () => resolve({}));
  });
}

// Home - Live + Upcoming + Odds
app.get('/', async (req, res) => {
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
    });
    
    // Fetch Polymarket odds
    const polyOdds = await fetchPolyOdds();
    
    res.render('index', {
      liveMatches,
      upcomingMatches,
      polyOdds,
      pageTitle: 'Football Stream'
    });
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('index', {
      liveMatches: [],
      upcomingMatches: [],
      polyOdds: {},
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
    
    if (!match) {
      return res.status(404).send('Match not found');
    }
    
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
    console.error('Vote error:', err);
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
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to report' });
  }
});

// API: Get WC 2026 winner odds from Polymarket
const fs = require('fs');
const ODDS_FILE = '/root/football-stream/data/poly-odds.json';

app.get('/api/odds', (req, res) => {
  try {
    // Dynamic fetch from Polymarket to get live odds
    const https = require('https');
    https.get('https://gamma-api.polymarket.com/markets?tagSlug=sports&limit=300&closed=false', (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const markets = JSON.parse(data);
          const odds = {};
          for (const m of markets) {
            const q = m.question || '';
            if (!q.includes('2026 FIFA World Cup') || !q.includes(' win ')) continue;
            const team = q.replace('Will ','').replace(' win the 2026 FIFA World Cup?','');
            const prices = JSON.parse(m.outcomePrices || '[]');
            if (prices.length < 2) continue;
            odds[team] = {
              yesPrice: prices[0],
              noPrice: prices[1],
              decimalOdds: prices[0] > 0 ? (1/parseFloat(prices[0])).toFixed(2) : null,
              impliedProb: (parseFloat(prices[0])*100).toFixed(1) + '%',
              volume: m.volume,
              slug: m.slug,
            };
          }
          // Sort by probability
          const sorted = Object.entries(odds).sort((a,b) => parseFloat(b[1].yesPrice) - parseFloat(a[1].yesPrice));
          res.json({ updatedAt: new Date().toISOString(), source: 'polymarket', odds: Object.fromEntries(sorted) });
        } catch {
          res.status(500).json({ error: 'Failed to parse odds data' });
        }
      });
    }).on('error', () => res.status(500).json({ error: 'Failed to fetch from Polymarket' }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats dashboard
app.use('/stats', statsRouter);

// Health check

// Redirect routes for convenience
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
