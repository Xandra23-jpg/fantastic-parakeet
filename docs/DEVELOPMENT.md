# Development Guide - PROJECT CHAOS

## Environment Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run development stack
docker-compose up
```

## Architecture Overview

### Frontend (Phaser 3 + React)
- **Game Loop**: 60 FPS Phaser instance
- **State**: Redux for UI, Phaser for game state
- **Networking**: Socket.io client for real-time sync
- **Assets**: Lazy-loaded, compressed WebP/WASM
- **Optimization**: Component memoization, scene caching

### Backend (Node.js)
- **Server**: Express.js + Socket.io
- **Matchmaking**: Redis queues, O(1) lookups
- **Game Logic**: Authoritative server (prevent cheating)
- **Database**: PostgreSQL for persistence
- **Cache**: Redis for sessions, leaderboards, inventory

### Database Schema
- **users**: Player accounts, progression
- **sessions**: Active game sessions
- **matches**: Match history & statistics
- **leaderboards**: Ranked data (cached)
- **inventory**: Weapons, cosmetics, skins
- **battle_pass**: Seasonal progression

## Code Style

- **Frontend**: ESLint + Prettier
- **Backend**: ESLint + Prettier
- **Commit msgs**: `[PHASE-X] Feature: Description`
- **Branches**: `feature/game-mode-name`, `fix/bug-name`

## Performance Targets

| Metric | Target | Current |
|--------|--------|----------|
| Initial Load | <3s | TBD |
| Asset Load | <2s | TBD |
| Matchmaking | <10s | TBD |
| Frame Rate | 60 FPS | TBD |
| Network Latency | <100ms | TBD |

## API Endpoints (Phase 2)

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Matchmaking
- `POST /api/matchmaking/queue` - Join queue
- `DELETE /api/matchmaking/queue/:id` - Leave queue
- `GET /api/matchmaking/status/:id` - Queue status

### Player Data
- `GET /api/player/:id` - Profile
- `PUT /api/player/:id` - Update profile
- `GET /api/player/:id/inventory` - Cosmetics & weapons

### Leaderboards
- `GET /api/leaderboards/global` - Global ranking
- `GET /api/leaderboards/friends` - Friends ranking
- `GET /api/leaderboards/weekly` - Weekly leaderboard

## WebSocket Events (Real-time)

### Client -> Server
- `player_move` - Player position & rotation
- `player_shoot` - Fire weapon
- `player_ability` - Use ability/power-up
- `player_interact` - Pick up loot, enter vehicle
- `chat_message` - Send message

### Server -> Client
- `player_joined` - New player entered match
- `player_left` - Player disconnected
- `player_state_update` - Position sync
- `game_event` - Map event, storm, etc.
- `match_end` - Game over

## Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Integration tests
npm run test:integration

# Performance benchmarks
npm run benchmark
```

## Deployment

### Local
```bash
docker-compose up
```

### Staging
```bash
docker build -t chaos:latest .
docker push chaos:latest
kubectl apply -f k8s/staging/
```

### Production
```bash
kubectl apply -f k8s/production/
```

## Debugging

### Frontend
- Open DevTools: `F12`
- Redux DevTools: Browser extension
- Phaser Debug Panel: `Ctrl+D`

### Backend
- Logs: `docker logs backend`
- Database: `psql -h localhost -U chaos -d chaos_db`
- Redis: `redis-cli`

## Contributing

1. Create branch: `git checkout -b feature/your-feature`
2. Make changes & commit: `git commit -m "[PHASE-1] Feature: Description"`
3. Push: `git push origin feature/your-feature`
4. Open PR with checklist
5. Address review & merge

## Resources
- Phaser 3 Docs: https://photonstorm.github.io/phaser3-docs/
- Socket.io Docs: https://socket.io/docs/
- PostgreSQL Docs: https://www.postgresql.org/docs/
