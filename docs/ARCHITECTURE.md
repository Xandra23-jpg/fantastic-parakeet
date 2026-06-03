# PROJECT CHAOS - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│  React Native (iOS/Android) + React Web (Browser)           │
│  - Phaser 3 Game Engine (60 FPS rendering)                 │
│  - Redux State Management                                   │
│  - Socket.io WebSocket Client                              │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌────────────────┐    ┌──────────────────┐
│  HTTP REST API │    │  WebSocket       │
│  (JSON)        │    │  (Real-time Sync)│
└────────┬───────┘    └────────┬─────────┘
         │                     │
         └────────────┬────────┘
                      ▼
      ┌───────────────────────────────┐
      │    BACKEND LAYER              │
      │    Node.js + Express.js       │
      │  - Authentication (JWT)       │
      │  - Matchmaking Queue (Redis)  │
      │  - Game State Engine          │
      │  - Match Orchestration        │
      └─────────┬──────────────────────┘
                │
        ┌───────┴───────┬──────────────┐
        │               │              │
        ▼               ▼              ▼
   ┌─────────┐  ┌──────────┐   ┌────────────┐
   │PostgreSQL│  │  Redis   │   │  Cloud    │
   │Database  │  │  Cache   │   │  Storage  │
   │- Players │  │- Sessions│   │- Assets   │
   │- Matches │  │- Leaderboards  │- Skins   │
   │- Inv.    │  │- Queues  │   │- Maps    │
   └─────────┘  └──────────┘   └────────────┘
```

## Component Breakdown

### Frontend Architecture

**Game Loop (Phaser 3)**
- Update cycle: 60 FPS
- Input handling: Keyboard, touch, controller
- Rendering: WebGL + Canvas fallback
- Asset management: Texture atlas, sprite batching
- Physics: Arcade Physics (lightweight)

**UI Layer (React)**
- Screens: MainMenu, Lobby, HUD, Results
- Components: Reusable, memoized
- State: Redux store for persistence
- Animations: Smooth transitions, no jank

**Networking (Socket.io)**
- Auto-reconnect with exponential backoff
- Message compression (binary protocol)
- Event debouncing: Player movement every 100ms
- Latency compensation: Client-side prediction

### Backend Architecture

**Express Server**
- RESTful API for non-real-time operations
- Static file serving (optimized)
- Request validation & rate limiting
- Error handling & logging

**WebSocket Handler**
- Connection pooling
- Room-based message broadcast
- Message ordering guarantees
- Graceful disconnection handling

**Matchmaking Engine**
- Redis-backed queue: O(1) operations
- Skill-based matching (ELO algorithm)
- Quick-fill: AI bots if needed
- Fair balancing: Swap players mid-queue

**Game State Manager**
- Authoritative server (client input → validation → broadcast)
- Tick-based updates (20 Hz game tick)
- State serialization for recovery
- Anti-cheat detection (server-side validation)

### Database Design

**PostgreSQL** (persistent data)
```sql
TABLE users
  ├─ id (PK)
  ├─ username, email
  ├─ level, xp, rank
  ├─ created_at, last_login
  └─ settings

TABLE matches
  ├─ id (PK)
  ├─ game_mode, map
  ├─ winner_id (FK users)
  ├─ player_ids (array)
  ├─ duration, kills, deaths
  └─ timestamp

TABLE inventory
  ├─ id (PK)
  ├─ user_id (FK)
  ├─ item_type (weapon, skin, emote)
  ├─ item_id
  ├─ rarity, unlocked_at
  └─ equipped

TABLE battle_pass
  ├─ id (PK)
  ├─ user_id (FK)
  ├─ season, level, xp
  ├─ is_premium
  └─ expires_at
```

**Redis** (fast caching)
- `session:{id}` - Active game sessions
- `queue:{mode}` - Matchmaking queues
- `player:{id}:inventory` - Current loadout
- `leaderboard:{timeframe}` - Rankings (sorted set)
- `match:{id}:state` - Live game state

**Cloud Storage**
- WebP textures (75% smaller than PNG)
- WASM modules (game physics)
- Audio: OGG Vorbis (smaller than MP3)
- Compressed at upload, CDN distribution

## Data Flow Examples

### 1. Player Joins Matchmaking
```
Client: POST /api/matchmaking/queue
  └─> Backend Auth: Validate JWT
      └─> Redis Queue: Add to tdm_queue
          └─> Matchmaking Engine: Check for 16-player match
              └─> If match found: Create game session
                  └─> WebSocket: Notify all players
                      └─> Client: Load map & assets
                          └─> "READY" event
```

### 2. Player Shoots
```
Client: WebSocket "player_shoot" event
  └─> Backend: Validate shot (hitbox, ammo, etc.)
      └─> Apply damage
      └─> Broadcast to nearby players: "damage_taken"
      └─> Update player health in Redis
          └─> If health = 0: "player_eliminated" event
              └─> Update match state
```

### 3. Match Ends
```
Backend: Timer reaches 0 OR 1 player left
  └─> Calculate stats (kills, damage, position)
  └─> Determine winner
  └─> Broadcast "match_end" + results
  └─> Award XP & cosmetics
  └─> Save match history to PostgreSQL
  └─> Update leaderboards (Redis sorted set)
  └─> Client: Show results screen
```

## Scalability Strategy

### Horizontal Scaling
- **Stateless API**: Express servers (load balanced)
- **Sticky Sessions**: WebSocket server affinity (match → server)
- **Database**: Read replicas for queries, write to primary
- **Cache Replication**: Redis cluster with failover

### Performance Optimization
- **Asset CDN**: All images/audio from edge locations
- **Gzip/Brotli**: Response compression (70% reduction)
- **Message Batching**: Group socket events (reduce overhead)
- **Lazy Loading**: Load maps only when needed
- **Code Splitting**: Separate bundle per screen

## Security

- **JWT Tokens**: 1-hour expiry, refresh tokens in HTTP-only cookie
- **Rate Limiting**: 100 requests/min per IP (matchmaking: 10/min)
- **Input Validation**: All user input sanitized
- **Authoritative Server**: Client inputs never trusted
- **TLS/SSL**: All connections encrypted
- **Cheat Detection**: Server-side validation + analytics

## Disaster Recovery

- **Automated Backups**: PostgreSQL daily + hourly snapshots
- **Redis Persistence**: RDB + AOF combined
- **Graceful Degradation**: Fallback to AI-only matches
- **Health Checks**: Continuous monitoring, auto-restart
- **Canary Deployments**: 5% traffic → 50% → 100%
