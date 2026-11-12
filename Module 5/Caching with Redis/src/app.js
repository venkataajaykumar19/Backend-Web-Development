'use strict';

// ─── GIVEN FILE — modify only to add caching (do not remove existing code) ───
// This file sets up the Express app and two routes.
// Your job: import cacheGet/cacheSet/cacheDel from ./cache and wire up:
//   GET /feed  → cache-aside with 60s TTL and X-Cache header
//   POST /posts → cacheDel after db.createPost()

require('dotenv').config();

const express = require('express');
const db      = require('./db');
const { cacheGet, cacheSet, cacheDel } = require('./cache');

const app = express();
app.use(express.json());

const FEED_KEY = 'feed:trending';
const FEED_TTL = 60;   // seconds

app.get('/health', (req, res) => res.json({ ok: true }));

// GET /feed — cache-aside: serve cache hits, otherwise query DB and populate cache.
app.get('/feed', async (req, res) => {
  const t0 = Date.now();

  try {
    const cached = await cacheGet(FEED_KEY);
    if (cached !== null) {
      const ms = Date.now() - t0;
      console.log(`[feed] HIT ${ms}ms`);
      return res.set('X-Cache', 'HIT').json(cached);
    }

    const posts = await db.getTrendingPosts();
    await cacheSet(FEED_KEY, posts, FEED_TTL);

    const ms = Date.now() - t0;
    console.log(`[feed] MISS ${ms}ms`);
    return res.set('X-Cache', 'MISS').json(posts);
  } catch (err) {
    console.error('[feed] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /posts — creates a new post and invalidates the stale trending feed cache.
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);
    await cacheDel(FEED_KEY);
    res.status(201).json(post);
  } catch (err) {
    console.error('[posts] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };
