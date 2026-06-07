const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/football.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT NOT NULL,
    match_date DATETIME NOT NULL,
    stadium TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    source_name TEXT NOT NULL,
    stream_url TEXT NOT NULL,
    quality TEXT DEFAULT 'HD',
    language TEXT DEFAULT 'EN',
    is_working INTEGER DEFAULT 1,
    votes_positive INTEGER DEFAULT 0,
    votes_negative INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
  CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league);
  CREATE INDEX IF NOT EXISTS idx_streams_match ON streams(match_id);
`);

class FootballDB {
  static getUpcomingMatches() {
    const stmt = db.prepare(`
      SELECT * FROM matches 
      WHERE match_date >= datetime('now') 
      ORDER BY match_date ASC 
      LIMIT 50
    `);
    return stmt.all();
  }

  static getLiveMatches() {
    const stmt = db.prepare(`
      SELECT * FROM matches 
      WHERE status = 'live' 
      ORDER BY match_date ASC
    `);
    return stmt.all();
  }

  static getMatchesByLeague(league) {
    if (league === 'live') return this.getLiveMatches();
    const stmt = db.prepare(`
      SELECT * FROM matches 
      WHERE league = ? AND match_date >= datetime('now')
      ORDER BY match_date ASC
      LIMIT 50
    `);
    return stmt.all(league);
  }

  static getMatchById(id) {
    const stmt = db.prepare('SELECT * FROM matches WHERE id = ?');
    return stmt.get(id);
  }

  static getStreamsByMatch(matchId) {
    const stmt = db.prepare(`
      SELECT * FROM streams 
      WHERE match_id = ? AND is_working = 1
      ORDER BY votes_positive - votes_negative DESC
    `);
    return stmt.all(matchId);
  }

  static addMatch(homeTeam, awayTeam, league, matchDate, stadium) {
    const stmt = db.prepare(`
      INSERT INTO matches (home_team, away_team, league, match_date, stadium)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(homeTeam, awayTeam, league, matchDate, stadium);
  }

  static addStream(matchId, sourceName, streamUrl, quality = 'HD', language = 'EN') {
    const stmt = db.prepare(`
      INSERT INTO streams (match_id, source_name, stream_url, quality, language)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(matchId, sourceName, streamUrl, quality, language);
  }

  static voteStream(streamId, voteType) {
    const column = voteType === 'positive' ? 'votes_positive' : 'votes_negative';
    const stmt = db.prepare(`UPDATE streams SET ${column} = ${column} + 1 WHERE id = ?`);
    return stmt.run(streamId);
  }

  static reportStream(streamId) {
    const stmt = db.prepare(`UPDATE streams SET is_working = 0 WHERE id = ?`);
    return stmt.run(streamId);
  }
}

module.exports = FootballDB;
