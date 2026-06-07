const express = require('express');
const router = express.Router();
const Database = require('../services/database');

/**
 * Stats Dashboard - Show project statistics
 */
router.get('/', (req, res) => {
  try {
    const db = require('better-sqlite3')('/root/football-stream/data/football.db');
    
    // Get stats
    const totalMatches = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
    const liveMatches = db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'live'").get().count;
    const totalStreams = db.prepare('SELECT COUNT(*) as count FROM streams').get().count;
    const workingStreams = db.prepare('SELECT COUNT(*) as count FROM streams WHERE is_working = 1').get().count;
    
    // Get recent matches
    const recentMatches = db.prepare(`
      SELECT m.*, 
             (SELECT COUNT(*) FROM streams WHERE match_id = m.id) as stream_count
      FROM matches m
      ORDER BY m.match_date DESC
      LIMIT 10
    `).all();
    
    // Get top streams by votes (handle missing column)
    let topStreams = [];
    try {
      topStreams = db.prepare(`
        SELECT s.*, m.home_team, m.away_team
        FROM streams s
        JOIN matches m ON s.match_id = m.id
        WHERE s.is_working = 1
        ORDER BY s.votes DESC
        LIMIT 5
      `).all();
    } catch (err) {
      // Fallback if votes column doesn't exist
      topStreams = db.prepare(`
        SELECT s.*, m.home_team, m.away_team, 0 as votes
        FROM streams s
        JOIN matches m ON s.match_id = m.id
        WHERE s.is_working = 1
        LIMIT 5
      `).all();
    }
    
    // Get league distribution
    const leagueStats = db.prepare(`
      SELECT league, COUNT(*) as match_count
      FROM matches
      GROUP BY league
      ORDER BY match_count DESC
    `).all();
    
    res.render('stats', {
      stats: {
        totalMatches,
        liveMatches,
        totalStreams,
        workingStreams,
        reliability: totalStreams > 0 ? Math.round((workingStreams / totalStreams) * 100) : 0
      },
      recentMatches,
      topStreams,
      leagueStats,
      pageTitle: 'Statistics'
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).send('Failed to load stats');
  }
});

/**
 * API: Get stats as JSON
 */
router.get('/api', (req, res) => {
  try {
    const db = require('better-sqlite3')('/root/football-stream/data/football.db');
    
    const totalMatches = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
    const liveMatches = db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'live'").get().count;
    const totalStreams = db.prepare('SELECT COUNT(*) as count FROM streams').get().count;
    const workingStreams = db.prepare('SELECT COUNT(*) as count FROM streams WHERE is_working = 1').get().count;
    
    res.json({
      totalMatches,
      liveMatches,
      totalStreams,
      workingStreams,
      reliability: totalStreams > 0 ? Math.round((workingStreams / totalStreams) * 100) : 0,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Stats API error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
