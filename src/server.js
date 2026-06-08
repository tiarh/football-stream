const express = require('express');
const path = require('path');
const Database = require('./services/database');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 8084;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Home - Live + Upcoming
app.get('/', (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    // Get LIVE matches (status = 'live')
    const liveMatches = Database.getLiveMatches();
    
    // Get upcoming matches (next 7 days, not live)
    const allUpcoming = Database.getUpcomingMatches();
    const upcomingMatches = allUpcoming.filter(m => {
      const matchDate = new Date(m.match_date);
      return matchDate > now && matchDate <= sevenDaysLater && m.status !== 'live';
    });
    
    // Check streams for each upcoming match
    upcomingMatches.forEach(match => {
      const streams = Database.getStreamsByMatchId(match.id);
      match.streams = streams;
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

// API: Get all matches (for testing)
app.get('/api/matches', (req, res) => {
  try {
    const live = Database.getLiveMatches();
    const upcoming = Database.getUpcomingMatches();
    res.json({ live, upcoming, total: live.length + upcoming.length });
  } catch (err) {
    console.error('API matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
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
