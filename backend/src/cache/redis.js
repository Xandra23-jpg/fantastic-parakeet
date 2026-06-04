const redis = require('redis');

let redisClient;

const initializeRedis = async () => {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis connected'));

  await redisClient.connect();
};

const getClient = () => redisClient;

const set = async (key, value, expiry = null) => {
  const options = expiry ? { EX: expiry } : {};
  await redisClient.set(key, JSON.stringify(value), options);
};

const get = async (key) => {
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
};

const del = async (key) => {
  await redisClient.del(key);
};

const pushQueue = async (queueName, value) => {
  await redisClient.lPush(queueName, JSON.stringify(value));
};

const popQueue = async (queueName) => {
  const value = await redisClient.rPop(queueName);
  return value ? JSON.parse(value) : null;
};

const getQueue = async (queueName) => {
  const items = await redisClient.lRange(queueName, 0, -1);
  return items.map(item => JSON.parse(item));
};

module.exports = {
  initializeRedis,
  getClient,
  set,
  get,
  del,
  pushQueue,
  popQueue,
  getQueue
};
