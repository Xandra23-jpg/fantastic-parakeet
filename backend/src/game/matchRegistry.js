const matches = new Map();

const add = (matchId, gameState) => {
  matches.set(matchId, gameState);
};

const get = (matchId) => {
  return matches.get(matchId);
};

const remove = (matchId) => {
  matches.delete(matchId);
};

const list = () => {
  return Array.from(matches.entries()).map(([id, instance]) => ({ id, instance }));
};

module.exports = { add, get, remove, list };
