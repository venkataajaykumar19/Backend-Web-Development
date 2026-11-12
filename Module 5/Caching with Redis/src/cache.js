'use strict';

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  lazyConnect: true,
});

// Keep Redis connection errors from becoming unhandled EventEmitter errors.
// Individual operations below also catch failures and degrade gracefully.
redis.on('error', (err) => {
  console.error('[cache] Redis error:', err.message);
});

async function cacheGet(key) {
  try {
    const value = await redis.get(key);
    return value === null ? null : JSON.parse(value);
  } catch (err) {
    console.error('[cache] GET failed:', err.message);
    return null;
  }
}

async function cacheSet(key, data, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.error('[cache] SET failed:', err.message);
  }
}

async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[cache] DEL failed:', err.message);
  }
}

module.exports = { redis, cacheGet, cacheSet, cacheDel };
