const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/connection');
const { set, get, del } = require('../cache/redis');

const SPAWN_POINTS = {
  city: [
    { x: 100, y: 100 }, { x: 800, y: 100 }, { x: 100, y: 600 }, { x: 800, y: 600 },
    { x: 450, y: 300 }, { x: 250, y: 450 }, { x: 600, y: 200 }
  ],
  desert: [
    { x: 50, y: 50 }, { x: 950, y: 50 }, { x: 50, y: 950 }, { x: 950, y: 950 },
    { x: 500, y: 500 }, { x: 250, y: 750 }, { x: 750, y: 250 }
  ]
};

class GameState {
  constructor(matchId, gameMode, map, players) {
    this.matchId = matchId;
    this.gameMode = gameMode;
    this.map = map;
    this.players = {};
    this.startTime = Date.now();
    this.maxDuration = parseInt(process.env.MATCH_DURATION) * 1000;
    this.isActive = true;
    this.tick = 0;
    
    players.forEach((player, index) => {
      const spawn = SPAWN_POINTS[map][index % SPAWN_POINTS[map].length];
      this.players[player.id] = {
        id: player.id,
        username: player.username,
        x: spawn.x,
        y: spawn.y,
        rotation: 0,
        health: 100,
        maxHealth: 100,
        ammo: 30,
        maxAmmo: 30,
        kills: 0,
        deaths: 0,
        isAlive: true,
        lastUpdate: Date.now(),
        inputState: {}
      };
    });
  }

  update() {
    this.tick++;
    const now = Date.now();
    const elapsed = now - this.startTime;

    if (elapsed > this.maxDuration) {
      this.endMatch();
      return;
    }

    Object.values(this.players).forEach(player => {
      if (!player.isAlive) return;
      
      const speed = 5;
      if (player.inputState.up) player.y -= speed;
      if (player.inputState.down) player.y += speed;
      if (player.inputState.left) player.x -= speed;
      if (player.inputState.right) player.x += speed;

      player.x = Math.max(0, Math.min(1000, player.x));
      player.y = Math.max(0, Math.min(1000, player.y));
    });
  }

  handlePlayerShoot(playerId, targetPlayerId) {
    const shooter = this.players[playerId];
    const target = this.players[targetPlayerId];
    
    if (!shooter || !target || !shooter.isAlive || !target.isAlive) return;
    if (shooter.ammo <= 0) return;

    shooter.ammo--;
    
    if (Math.random() > 0.8) return;
    
    const damage = 10 + Math.floor(Math.random() * 15);
    target.health -= damage;
    
    if (target.health <= 0) {
      target.health = 0;
      target.isAlive = false;
      target.deaths++;
      shooter.kills++;
    }
  }

  getState() {
    return {
      matchId: this.matchId,
      gameMode: this.gameMode,
      map: this.map,
      players: this.players,
      isActive: this.isActive,
      elapsed: Date.now() - this.startTime,
      maxDuration: this.maxDuration
    };
  }

  endMatch() {
    this.isActive = false;
    const winner = Object.values(this.players).sort((a, b) => b.kills - a.kills)[0];
    return {
      matchId: this.matchId,
      winner: winner ? winner.id : null,
      stats: Object.values(this.players).map(p => ({
        id: p.id,
        username: p.username,
        kills: p.kills,
        deaths: p.deaths,
        placement: p.isAlive ? 1 : 2
      }))
    };
  }
}

const createMatch = async (matchId, gameMode, map, players) => {
  const gameState = new GameState(matchId, gameMode, map, players);
  await set(`match:${matchId}`, gameState.getState(), 3600);
  return gameState;
};

const getMatch = async (matchId) => {
  const state = await get(`match:${matchId}`);
  if (!state) return null;
  const gameState = new GameState(state.matchId, state.gameMode, state.map, []);
  gameState.players = state.players;
  gameState.tick = state.tick || 0;
  return gameState;
};

const saveMatchResult = async (matchId, stats) => {
  try {
    const result = await query(
      `INSERT INTO matches (id, game_mode, map, player_count, duration, ended_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`,
      [matchId, stats.gameMode, stats.map, stats.players.length, stats.duration || 0]
    );

    for (const playerStat of stats.players) {
      await query(
        `INSERT INTO match_players (match_id, user_id, kills, deaths, xp_earned, placement)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [matchId, playerStat.id, playerStat.kills, playerStat.deaths, playerStat.xp || 10, playerStat.placement || 2]
      );
    }
  } catch (error) {
    console.error('Error saving match result:', error);
  }
};

module.exports = {
  GameState,
  createMatch,
  getMatch,
  saveMatchResult
};
