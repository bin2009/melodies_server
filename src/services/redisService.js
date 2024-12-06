// const redis = require('redis');
// import redis from 'redis';
import { createClient } from 'redis';

export const client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

client.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Could not connect to Redis', error);
    }
};

// module.exports = {
//     client,
//     connectRedis,
// };
