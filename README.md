# ⚽ Football Stream

> **Free, Real-Time Football Streaming Platform** - Watch live matches with zero fake fixtures, zero bullshit.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/status-production-green)]()
[![Stars](https://img.shields.io/github/stars/tiarh/football-stream?style=social)](https://github.com/tiarh/football-stream)

---

## 🚀 Features

### 🔴 **Live Now**
- Real-time match tracking
- Only shows matches that are **actually live** right now
- Auto-refresh every 60 seconds
- Red pulse animation for live matches

### 📅 **Next 7 Days**
- Upcoming fixtures from verified APIs
- Countdown timers to kickoff
- Stream availability indicators
- League & competition info

### 📺 **Quality Streams**
- **H-4 Hours** before kickoff - streams auto-added
- 2+ verified streams per match
- Quality badges (FHD, HD, SD)
- Reliability scores
- Vote & report system

### ✅ **No Fake Fixtures**
- **100% API-driven** - Football-Data.org
- Zero manual fixtures
- Honest empty state when no matches
- Auto-clear finished matches

### 🎨 **Beautiful UI**
- Dark theme with gradient backgrounds
- Smooth animations & transitions
- Mobile-responsive design
- Live countdown timers
- Toast notifications

### 🐳 **Easy Deploy**
- Docker & Docker Compose ready
- PM2 process management
- Auto-restart on crash
- Health checks included

---

## 📸 Screenshots

### Homepage
![Homepage](https://via.placeholder.com/1200x675/0f172a/3b82f6?text=Football+Stream+Homepage)
*Live matches + upcoming fixtures with beautiful cards*

### Match Detail
![Match Detail](https://via.placeholder.com/1200x675/0f172a/3b82f6?text=Match+Detail+Page)
*Embedded player with multiple stream options*

### Mobile View
![Mobile](https://via.placeholder.com/400x800/0f172a/3b82f6?text=Mobile+Responsive)
*Fully responsive on all devices*

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Frontend:** EJS + Tailwind CSS
- **Video Player:** Video.js with HLS support
- **API:** Football-Data.org
- **Process Manager:** PM2
- **Container:** Docker

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/tiarh/football-stream.git
cd football-stream

# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:8084
```

### Option 2: Manual Install

```bash
# Clone repository
git clone https://github.com/tiarh/football-stream.git
cd football-stream

# Install dependencies
npm install

# Initialize database
node scripts/init-db.js

# Start server
node src/server.js

# Or with PM2 (production)
pm2 start src/server.js --name football-stream
pm2 save
pm2 startup
```

### Option 3: One-Click Deploy

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/)

---

## 📖 API Documentation

### Endpoints

#### `GET /`
Homepage with live + upcoming matches

#### `GET /match/:id`
Match detail page with streams

#### `GET /api/matches`
```json
{
  "live": [
    {
      "id": 1,
      "home_team": "Real Madrid",
      "away_team": "Barcelona",
      "league": "La Liga",
      "match_date": "2026-06-10T20:00:00Z",
      "status": "live"
    }
  ],
  "upcoming": [...],
  "total": 15
}
```

#### `GET /health`
```json
{
  "status": "ok",
  "timestamp": "2026-06-07T20:00:00Z"
}
```

#### `POST /api/vote`
Vote for stream quality
```json
{
  "streamId": 1,
  "value": 1
}
```

#### `POST /api/report`
Report broken stream
```json
{
  "streamId": 1,
  "reason": "Stream offline"
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8084` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `DATABASE_PATH` | `/app/data/football.db` | SQLite database path |
| `FOOTBALL_DATA_API_KEY` | - | Optional API key for higher rate limits |

### Cron Jobs

Auto-fetch fixtures every hour:
```bash
0 * * * * cd /path/to/football-stream && node scripts/fetch-real-fixtures.js
```

---

## 📊 Project Structure

```
football-stream/
├── src/
│   ├── server.js          # Express server
│   └── services/
│       └── database.js    # Database operations
├── views/
│   ├── index.ejs          # Homepage
│   ├── match.ejs          # Match detail
│   └── layout.ejs         # Base layout
├── public/
│   ├── css/
│   │   └── style.css      # Custom styles
│   └── js/
│       └── countdown.js   # Countdown timers
├── scripts/
│   ├── fetch-real-fixtures.js  # API fetcher
│   ├── init-db.js         # Database init
│   └── ...
├── data/
│   └── football.db        # SQLite database
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🔧 Development

### Run in Development Mode

```bash
npm install
npm run dev
```

### Run Tests

```bash
npm test
```

### Build Docker Image

```bash
docker build -t football-stream .
```

---

## 🌟 Features Roadmap

- [ ] User accounts & favorites
- [ ] Push notifications for match start
- [ ] Multi-language support
- [ ] Team & league pages
- [ ] Match statistics & lineups
- [ ] Chat room per match
- [ ] Stream archive (replays)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Discord bot integration

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Football-Data.org** - Free football API
- **Video.js** - Amazing video player
- **Tailwind CSS** - Beautiful UI framework
- **All contributors** - You rock! ⭐

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/tiarh/football-stream/issues)
- **Discussions:** [GitHub Discussions](https://github.com/tiarh/football-stream/discussions)
- **Email:** tiar@lumayancuk.com

---

## 🎯 Why This Project?

> "Tired of fake streaming sites with abal-abal fixtures? So was I. Football Stream shows **only real matches** from verified APIs. No bullshit, no fake Spain vs Portugal in 2026. Just honest football streaming."

**Built with ❤️ by [@tiarh](https://github.com/tiarh)**

---

<div align="center">

**If you like this project, please ⭐ star this repo!**

[![GitHub stars](https://img.shields.io/github/stars/tiarh/football-stream?style=social)](https://github.com/tiarh/football-stream/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/tiarh/football-stream?style=social)](https://github.com/tiarh/football-stream/network/members)

</div>
