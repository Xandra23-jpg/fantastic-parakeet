const { getMatch, saveMatchResult } = require('./gameState');
const { updateUserStats, addUserXP } = require('../services/auth');

const activeGames = {};

const handlePlayerMove = async (socket, data) => {
  const { matchId, x, y, rotation } = data;
  const match = await getMatch(matchId);
  
  if (match && match.players[socket.id]) {
    match.players[socket.id].x = x;
    match.players[socket.id].y = y;
    match.players[socket.id].rotation = rotation;
  }
};

const handlePlayerShoot = async (socket, data) => {
  const { matchId, targetPlayerId } = data;
  const match = await getMatch(matchId);
  
  if (match) {
    match.handlePlayerShoot(socket.id, targetPlayerId);
    
    socket.emit('player_shot', {
      shooterId: socket.id,
      targetId: targetPlayerId,
      targetHealth: match.players[targetPlayerId]?.health || 0
    });
  }
};

const handlePlayerAction = async (socket, data) => {
  const { matchId, action } = data;
  const match = await getMatch(matchId);
  
  if (match) {
    socket.emit('action_executed', { action });
  }
};

const handleMatchReady = async (socket) => {
  socket.emit('match_start', { message: 'Match started!' });
};

const handlePlayerDisconnect = async (socket) => {
  console.log(`Player ${socket.id} disconnected`);
};

module.exports = {
  handlePlayerMove,
  handlePlayerShoot,
  handlePlayerAction,
  handleMatchReady,
  handlePlayerDisconnect
};
