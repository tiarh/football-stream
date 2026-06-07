const Database = require('better-sqlite3')('/root/football-stream/data/football.db');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.dirname('/root/football-stream/data/football.db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function init() {
  // Create matches table
  Database.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      league TEXT NOT NULL,
      match_date TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create streams table
  Database.exec(`
    CREATE TABLE IF NOT EXISTS streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      source_name TEXT NOT NULL,
      stream_url TEXT NOT NULL,
      quality TEXT DEFAULT 'HD',
      language TEXT DEFAULT 'EN',
      votes INTEGER DEFAULT 0,
      reports INTEGER DEFAULT 0,
      is_working INTEGER DEFAULT 1,
      type TEXT DEFAULT 'link',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id)
    )
  `);

  console.log('✓ Database initialized');
}

function getLiveMatches() {
  return Database.prepare('SELECT * FROM matches WHERE status = ? ORDER BY match_date ASC').all('live');
}

function getUpcomingMatches() {
  return Database.prepare('SELECT * FROM matches WHERE status != ? ORDER BY match_date ASC').all('live');
}

function getMatchById(id) {
  return Database.prepare('SELECT * FROM matches WHERE id = ?').get(id);
}

function getStreamsByMatchId(matchId) {
  return Database.prepare('SELECT * FROM streams WHERE match_id = ? AND is_working = 1 ORDER BY votes DESC').all(matchId);
}

function addMatch(homeTeam, awayTeam, league, matchDate, status = 'scheduled') {
  const result = Database.prepare(
    'INSERT INTO matches (home_team, away_team, league, match_date, status) VALUES (?, ?, ?, ?, ?)'
  ).run(homeTeam, awayTeam, league, matchDate, status);
  return result.lastInsertRowid;
}

function addStream(matchId, sourceName, streamUrl, quality = 'HD', language = 'EN', type = 'link', note = '') {
  Database.prepare(
    'INSERT INTO streams (match_id, source_name, stream_url, quality, language, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(matchId, sourceName, streamUrl, quality, language, type, note);
}

function voteStream(streamId, value = 1) {
  Database.prepare('UPDATE streams SET votes = votes + ? WHERE id = ?').run(value, streamId);
}

function reportStream(streamId, reason = '') {
  Database.prepare('UPDATE streams SET reports = reports + 1 WHERE id = ?').run(streamId);
  if (reason) {
    console.log(`Report for stream ${streamId}: ${reason}`);
  }
}

function clearOldMatches(hours = 3) {
  Database.prepare(`DELETE FROM streams WHERE match_id IN (SELECT id FROM matches WHERE match_date < datetime('now', '-${hours} hours') AND status = 'finished')`).run();
  Database.prepare(`DELETE FROM matches WHERE match_date < datetime('now', '-${hours} hours') AND status = 'finished'`).run();
}

module.exports = {
  init,
  getLiveMatches,
  getUpcomingMatches,
  getMatchById,
  getStreamsByMatchId,
  addMatch,
  addStream,
  voteStream,
  reportStream,
  clearOldMatches
};
