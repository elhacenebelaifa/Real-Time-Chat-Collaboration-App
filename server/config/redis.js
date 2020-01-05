const redis = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Separate clients for pub/sub (Redis requirement) and general commands
const pubClient = redis.createClient(redisUrl);
const subClient = redis.createClient(redisUrl);
const redisClient = redis.createClient(redisUrl);

pubClient.on('error', (err) => console.error('Redis pub error:', err.message));
subClient.on('error', (err) => console.error('Redis sub error:', err.message));
redisClient.on('error', (err) => console.error('Redis client error:', err.message));

pubClient.on('connect', () => console.log('> Redis publisher connected'));
subClient.on('connect', () => console.log('> Redis subscriber connected'));
redisClient.on('connect', () => console.log('> Redis client connected'));

module.exports = { pubClient, subClient, redisClient };
