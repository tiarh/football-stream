# ⚽ Football Stream

**Free Live Football Streaming Aggregator** - Watch UCL, World Cup, Premier League, La Liga, Serie A, Bundesliga & more!

## Features

- 🏆 **Multiple Leagues**: UCL, Premier League, La Liga, Serie A, Bundesliga, World Cup
- 🔴 **Live Matches**: Real-time live match indicators
- 📺 **Multiple Streams**: Aggregated from various sources with quality ratings
- 👍 **Community Voting**: Upvote working streams, downvote broken ones
- ⚡ **Fast & Lightweight**: Built with Node.js + Express
- 📱 **Mobile Responsive**: Tailwind CSS responsive design
- 🗄️ **SQLite Database**: Lightweight, no external dependencies

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: EJS templates + Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Deployment**: PM2 for production

## Installation

```bash
# Clone repository
git clone https://github.com/tiarh/football-stream.git
cd football-stream

# Install dependencies
npm install

# Initialize database with sample matches
npm run db:init

# Start server
npm start
```

## Usage

1. Open browser: `http://localhost:8084`
2. Browse upcoming matches by league
3. Click on a match to view available streams
4. Vote for working streams or report broken ones

## API Endpoints

- `GET /` - Home page with all matches
- `GET /league/:league` - Filter by league (UCL, Premier League, etc.)
- `GET /match/:id` - Match detail page with streams
- `GET /api/matches` - JSON API for upcoming matches
- `GET /health` - Health check

## Add Real Streams

This project uses placeholder URLs. To add real streaming links:

1. **Manual**: Add via database directly
2. **Scraper**: Build web scrapers for streaming sites
3. **User Submissions**: Add form for community submissions

```javascript
// Example: Add stream to database
Database.addStream(matchId, 'SourceName', 'https://real-stream-url.com', 'HD', 'EN');
```

## Production Deployment

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name football-stream

# Auto-start on server reboot
pm2 save
pm2 startup
```

## Environment Variables

```bash
PORT=8084
NODE_ENV=production
```

## Disclaimer

This project is a **stream aggregator** and does not host any video content. All streams are embedded from third-party sources. Users are responsible for complying with their local copyright laws.

## License

MIT License - feel free to use for personal projects!

---

**Built with ❤️ by Tiar**
