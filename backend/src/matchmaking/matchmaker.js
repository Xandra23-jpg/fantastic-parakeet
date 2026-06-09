const { v4: uuidv4 } = require('uuid');
const { pushQueue, popQueue, getQueue, del } = require('../cache/redis');
const { createMatch } = require('./gameState');

const queues = {};

const joinQueue = async (queueName, player) => {
  const queueKey = `queue:${queueName}`;
  await pushQueue(queueKey, player);
  
  if (!queues[queueName]) {
    queues[queueName] = [];
  }
  queues[queueName].push(player.id);
  
  console.log(`Player ${player.username} joined ${queueName} queue. Queue size: ${queues[queueName].length}`);
  
  return checkForMatch(queueName);
};

const leaveQueue = async (queueName, playerId) => {
  if (queues[queueName]) {
    queues[queueName] = queues[queueName].filter(id => id !== playerId);
  }
};

const checkForMatch = async (queueName) => {
  const minPlayers = parseInt(process.env.MIN_PLAYERS_FOR_MATCH) || 2;
  const queueKey = `queue:${queueName}`;
  const queueData = await getQueue(queueKey);
  
  if (queueData && queueData.length >= minPlayers) {
    const players = queueData.slice(0, minPlayers);
    
    for (let i = 0; i < minPlayers; i++) {
      await popQueue(queueKey);
    }
    
    if (queues[queueName]) {
      queues[queueName] = queues[queueName].filter(
        id => !players.find(p => p.id === id)
      );
    }
    
    const matchId = uuidv4();
    const gameMode = queueName === 'tdm' ? 'team_deathmatch' : 'battle_royale';
    const map = queueName === 'tdm' ? 'city' : 'desert';
    
    const match = await createMatch(matchId, gameMode, map, players);
    
    console.log(`✅ Match created: ${matchId} with ${players.length} players`);
    
    return {
      matchId,
      players,
      gameMode,
      map
    };
  }
  
  return null;
};

const getQueueStatus = async (queueName) => {
  return queues[queueName] ? queues[queueName].length : 0;
};

module.exports = {
  joinQueue,
  leaveQueue,
  checkForMatch,
  getQueueStatus
};
