# 🎮 PROJECT CHAOS - Multiplayer Action Game

> A highly addictive, social, action-packed multiplayer game combining Call of Duty progression, Fortnite-style live events, Fall Guys fun, and GTA-style freedom.

## 🎯 Core Mission
**Fun every 30-60 seconds.** No downtime. Instant feedback. Endless engagement.

## 📱 Tech Stack
- **Frontend**: React Native (mobile) + React Web
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Redis (caching)
- **Game Engine**: Phaser 3 (lightweight, perfect for mobile)
- **Real-time**: WebSockets (Socket.io)
- **Deployment**: Docker + Kubernetes ready
- **CDN**: Cloudflare for asset delivery

## 📊 Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Core gameplay loop | 🚀 IN PROGRESS |
| 2 | Multiplayer matchmaking | ⏳ Planned |
| 3 | Progression & battle pass | ⏳ Planned |
| 4 | Social features (clans, chat) | ⏳ Planned |
| 5 | Live events & updates | ⏳ Planned |
| 6 | Monetization | ⏳ Planned |

## 🎮 Game Modes
1. **Battle Royale** - Last player standing
2. **Team Deathmatch** - Kill-based competition
3. **Zombie Survival** - Wave-based PvE
4. **Extraction** - Risk/reward loot gathering
5. **Parkour Challenges** - Skill-based racing
6. **Daily Missions** - Repeatable objectives

## 🗺️ Maps
- City (urban combat)
- Desert (open warfare)
- Jungle (dense cover)
- Snow (slippery terrain)
- Island (mixed terrain)

## 🏗️ Project Structure

```
fantastic-parakeet/
├── frontend/                 # Mobile + web UI
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── screens/         # Game screens
│   │   ├── game/            # Game logic (Phaser)
│   │   ├── multiplayer/     # WebSocket client
│   │   ├── store/           # State management
│   │   └── utils/           # Helpers, cache, compression
│   ├── package.json
│   └── webpack.config.js
├── backend/                  # Node.js server
│   ├── src/
│   │   ├── server/          # Express + Socket.io
│   │   ├── matchmaking/     # Queue & session logic
│   │   ├── game/            # Game state & rules
│   │   ├── database/        # DB queries & models
│   │   ├── cache/           # Redis strategies
│   │   ├── api/             # REST endpoints
│   │   └── utils/           # Helpers
│   ├── package.json
│   └── .env.example
├── database/                 # SQL migrations & schemas
│   ├── migrations/
│   └── seeds/
├── docs/                     # Architecture & API docs
└── docker-compose.yml        # Local dev environment
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Xandra23-jpg/fantastic-parakeet.git
cd fantastic-parakeet

# Install & run
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Docs: http://localhost:8080
```

## 📈 Key Metrics (MVP Goals)
- ⚡ **Sub-10s matchmaking**
- ⚡ **Unlock every 5-10 minutes**
- ⚡ **<3s load times**
- ⚡ **Zero downtime**
- 🎯 **100% mobile-optimized**

## 📝 Contributing
See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for setup & architecture details.

## 📄 License
MIT
