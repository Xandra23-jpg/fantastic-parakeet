const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { initializeDatabase } = require('./database/connection');
const { initializeRedis } = require('./cache/redis');
const gameHandler = require('./game/gameHandler');
const matchmakingHandler = require('./matchmaking/matchmakingHandler');
const authRoutes = require('./api/auth');
const playerRoutes = require('./api/player');
const matchRoutes = require('./api/match');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/match', matchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket Connection
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  socket.on('join_queue', (data) => matchmakingHandler.joinQueue(socket, data));
  socket.on('leave_queue', () => matchmakingHandler.leaveQueue(socket));
  socket.on('player_move', (data) => gameHandler.handlePlayerMove(socket, data));
  socket.on('player_shoot', (data) => gameHandler.handlePlayerShoot(socket, data));
  socket.on('player_action', (data) => gameHandler.handlePlayerAction(socket, data));
  socket.on('match_ready', () => gameHandler.handleMatchReady(socket));
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    matchmakingHandler.leaveQueue(socket);
    gameHandler.handlePlayerDisconnect(socket);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize server
async function start() {
  try {
    console.log('🔧 Initializing PROJECT CHAOS...');
    
    await initializeDatabase();
    console.log('✅ Database connected');
    
    await initializeRedis();
    console.log('✅ Redis connected');
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🎮 Game server running on port ${PORT}`);
      console.log(`🎯 WebSocket ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = { app, io, server };
