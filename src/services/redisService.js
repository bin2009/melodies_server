const redis = require('redis');
let redisClient;

const initializeRedis = () => {
    redisClient = redis.createClient();
    redisClient.on('error', (err) => {
        console.log('Redis error:', err);
    });
};

const getRedisClient = () => redisClient;

module.exports = {
    initializeRedis,
    getRedisClient,
};
