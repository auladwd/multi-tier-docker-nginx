const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'devops_user',
  password: process.env.DB_PASSWORD || 'devops_pass',
  database: process.env.DB_NAME || 'devops_db',
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.on('error', (err) => console.error('Redis error:', err.message));

async function initConnections() {
  await redisClient.connect();
}

const CACHE_KEY = 'tasks:all';

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    const redisPing = await redisClient.ping();
    res.json({
      status: 'healthy',
      database: 'connected',
      redis: redisPing === 'PONG' ? 'connected' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

app.get('/api/tasks', async (_req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) {
      return res.json({ source: 'redis-cache', tasks: JSON.parse(cached) });
    }

    const result = await pool.query(
      'SELECT id, title, status, created_at FROM tasks ORDER BY id DESC'
    );
    await redisClient.setEx(CACHE_KEY, 30, JSON.stringify(result.rows));

    res.json({ source: 'postgresql', tasks: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, status) VALUES ($1, $2) RETURNING id, title, status, created_at',
      [title.trim(), 'pending']
    );
    await redisClient.del(CACHE_KEY);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    await redisClient.del(CACHE_KEY);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initConnections()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize backend:', err);
    process.exit(1);
  });
