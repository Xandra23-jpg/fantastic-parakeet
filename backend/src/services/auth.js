const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/connection');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const createUser = async (username, email, password) => {
  const hashedPassword = await hashPassword(password);
  const userId = uuidv4();

  try {
    await query(
      `INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)`,
      [userId, username, email, hashedPassword]
    );

    await query(
      `INSERT INTO player_stats (user_id) VALUES ($1)`,
      [userId]
    );

    return userId;
  } catch (error) {
    throw new Error('User creation failed: ' + error.message);
  }
};

const getUser = async (userId) => {
  const result = await query(
    `SELECT id, username, email, level, xp, rank, kills, deaths, wins, created_at, last_login FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const getUserByUsername = async (username) => {
  const result = await query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
};

const updateUserLastLogin = async (userId) => {
  await query(
    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
    [userId]
  );
};

const addUserXP = async (userId, xp) => {
  const result = await query(
    `UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp, level`,
    [xp, userId]
  );
  return result.rows[0];
};

const updateUserStats = async (userId, stats) => {
  const { kills, deaths, wins } = stats;
  await query(
    `UPDATE users SET kills = kills + $1, deaths = deaths + $2, wins = wins + $3 WHERE id = $4`,
    [kills || 0, deaths || 0, wins || 0, userId]
  );
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  createUser,
  getUser,
  getUserByUsername,
  updateUserLastLogin,
  addUserXP,
  updateUserStats
};
