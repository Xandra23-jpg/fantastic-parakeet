const { Pool } = require('pg');

let pool;

const initializeDatabase = async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();
  
  await runMigrations();
};

const runMigrations = async () => {
  const migrations = [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      level INT DEFAULT 1,
      xp INT DEFAULT 0,
      rank INT DEFAULT 0,
      kills INT DEFAULT 0,
      deaths INT DEFAULT 0,
      wins INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_mode VARCHAR(50) NOT NULL,
      map VARCHAR(50) NOT NULL,
      winner_id UUID,
      player_count INT,
      duration INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP,
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS match_players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL,
      user_id UUID NOT NULL,
      kills INT DEFAULT 0,
      deaths INT DEFAULT 0,
      damage_dealt INT DEFAULT 0,
      xp_earned INT DEFAULT 0,
      placement INT,
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS player_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL,
      total_kills INT DEFAULT 0,
      total_deaths INT DEFAULT 0,
      total_matches INT DEFAULT 0,
      win_rate DECIMAL(5,2) DEFAULT 0,
      avg_damage DECIMAL(8,2) DEFAULT 0,
      playtime_seconds INT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      item_type VARCHAR(50) NOT NULL,
      item_id VARCHAR(100) NOT NULL,
      rarity VARCHAR(20) DEFAULT 'common',
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      equipped BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, item_type, item_id)
    )`
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Migration error:', error);
      }
    }
  }
};

const query = (text, params) => {
  return pool.query(text, params);
};

const getClient = () => {
  return pool.connect();
};

module.exports = {
  initializeDatabase,
  query,
  getClient,
  pool
};
