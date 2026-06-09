const { getUser } = require('../services/auth');
const { joinQueue, checkForMatch } = require('./matchmaker');

const playerQueues = {};

const handleJoinQueue = async (socket, data) => {
  try {
    const { gameMode, userId } = data;
    
    const player = await getUser(userId);
    if (!player) {
      socket.emit('error', 'Player not found');
      return;
    }
    
    const queueName = gameMode === 'tdm' ? 'tdm' : 'battle_royale';
    playerQueues[socket.id] = queueName;
    
    const matchData = await joinQueue(queueName, {
      id: socket.id,
      userId: userId,
      username: player.username,
      level: player.level,
      rank: player.rank
    });
    
    if (matchData) {
      socket.emit('match_found', matchData);
      matchData.players.forEach(p => {
        socket.to(p.id).emit('match_found', matchData);
      });
    } else {
      socket.emit('queue_joined', { gameMode, queueName, message: 'Waiting for players...' });
    }
  } catch (error) {
    console.error('Queue join error:', error);
    socket.emit('error', 'Failed to join queue');
  }
};

const handleLeaveQueue = async (socket) => {
  try {
    const queueName = playerQueues[socket.id];
    if (queueName) {
      await require('./matchmaker').leaveQueue(queueName, socket.id);
      delete playerQueues[socket.id];
      socket.emit('queue_left', { message: 'Left queue' });
    }
  } catch (error) {
    console.error('Queue leave error:', error);
  }
};

module.exports = {
  joinQueue: handleJoinQueue,
  leaveQueue: handleLeaveQueue
};
