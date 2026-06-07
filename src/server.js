const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const Database = require('./services/database');
const app = express();
const PORT = process.env.PORT || 8084;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.get('/', async (req, res) => {
  try {
    const matches = await Database.getUpcomingMatches();
    const liveMatches = await Database.getLiveMatches();
    res.render('index', { matches, liveMatches, currentLeague: 'all' });
  } catch (err) {
    res.render('index', { matches: [], liveMatches: [], currentLeague: 'all' });
  }
});

app.get('/league/:league', async (req, res) => {
  try {
    const { league } = req.params;
    const matches = await Database.getMatchesByLeague(league);
    const liveMatches = league === 'live' ? await Database.getLiveMatches() : [];
    res.render('index', { matches, liveMatches, currentLeague: league });
  } catch (err) {
    res.render('index', { matches: [], liveMatches: [], currentLeague: req.params.league });
  }
});

app.get('/match/:id', async (req, res) => {
  try {
    const match = await Database.getMatchById(req.params.id);
    if (!match) return res.status(404).send('Match not found');
    const streams = await Database.getStreamsByMatch(req.params.id);
    res.render('match', { match, streams });
  } catch (err) {
    res.status(500).send('Error loading match');
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    const matches = await Database.getUpcomingMatches();
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scrape Yalla Shoot endpoint
app.get('/api/scrape', (req, res) => {
  console.log('🔍 Triggering Yalla Shoot scraper...');
  
  exec('python3 /root/football-stream/scripts/yalla-scraper.py', (error, stdout, stderr) => {
    if (error) {
      console.error(`Scraper error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        output: stdout 
      });
    }
    
    console.log(`Scraper output:\n${stdout}`);
    res.json({ 
      success: true, 
      message: 'Scraper completed',
      output: stdout 
    });
  });
});

app.post('/api/vote', (req, res) => {
  try {
    const { streamId, voteType } = req.body;
    if (!streamId || !voteType) return res.status(400).json({ error: 'Invalid data' });
    Database.voteStream(streamId, voteType);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/report', (req, res) => {
  try {
    const { streamId } = req.body;
    if (!streamId) return res.status(400).json({ error: 'Invalid stream ID' });
    Database.reportStream(streamId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-scrape on startup (run in background)
setTimeout(() => {
  console.log('🚀 Running auto-scrape on startup...');
  exec('python3 /root/football-stream/scripts/yalla-scraper.py', (error, stdout) => {
    if (error) {
      console.log(`Auto-scrape completed with errors: ${error.message}`);
    } else {
      console.log(`Auto-scrape completed:\n${stdout}`);
    }
  });
}, 5000);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║      Football Stream Server Started               ║
╠═══════════════════════════════════════════════════╣
║  Local:    http://localhost:${PORT}                 
║  Health:   http://localhost:${PORT}/health          
║  Scrape:   http://localhost:${PORT}/api/scrape      
╚═══════════════════════════════════════════════════╝
  `);
});
