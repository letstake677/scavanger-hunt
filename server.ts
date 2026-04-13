import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
export { app };
const PORT = 3000;

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// PostgreSQL Connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable is not set. Database features will fail.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize Database Table
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        address VARCHAR(255) UNIQUE,
        username VARCHAR(255) NOT NULL,
        profile_pic TEXT,
        avatar_gender VARCHAR(10) DEFAULT 'male',
        score INTEGER DEFAULT 0,
        completed_hunts INTEGER DEFAULT 0,
        has_completed_initial_hunt BOOLEAN DEFAULT FALSE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Add columns if they don't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_gender') THEN
          ALTER TABLE users ADD COLUMN avatar_gender VARCHAR(10) DEFAULT 'male';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_pic') THEN
          ALTER TABLE users ADD COLUMN profile_pic TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_completed_initial_hunt') THEN
          ALTER TABLE users ADD COLUMN has_completed_initial_hunt BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
    console.log('PostgreSQL table initialized');
  } catch (err) {
    console.error('Error initializing PostgreSQL table:', err);
  }
};

initDb();

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', postgres: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', postgres: 'disconnected' });
  }
});

// User Status Route
app.get('/api/user/:address', async (req, res) => {
  try {
    const normalizedAddress = req.params.address.toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE address = $1', [normalizedAddress]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Map snake_case to camelCase for frontend compatibility
    const user = result.rows[0];
    res.json({
      address: user.address,
      username: user.username,
      profilePic: user.profile_pic,
      avatarGender: user.avatar_gender,
      score: user.score,
      completedHunts: user.completed_hunts,
      hasCompletedInitialHunt: user.has_completed_initial_hunt,
      lastUpdated: user.last_updated
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Leaderboard Routes
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY score DESC LIMIT 10');
    const players = result.rows.map(user => ({
      address: user.address,
      username: user.username,
      profilePic: user.profile_pic,
      avatarGender: user.avatar_gender,
      score: user.score,
      completedHunts: user.completed_hunts,
      hasCompletedInitialHunt: user.has_completed_initial_hunt,
      lastUpdated: user.last_updated
    }));
    res.json(players);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/api/user/update-profile', async (req, res) => {
  const { address, username, profilePic, avatarGender } = req.body;
  
  try {
    if (!address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const normalizedAddress = address.toLowerCase();
    
    const query = `
      INSERT INTO users (address, username, profile_pic, avatar_gender, score, completed_hunts, has_completed_initial_hunt, last_updated)
      VALUES ($1, $2, $3, $4, 0, 0, FALSE, CURRENT_TIMESTAMP)
      ON CONFLICT (address) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        profile_pic = EXCLUDED.profile_pic,
        avatar_gender = EXCLUDED.avatar_gender,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(query, [
      normalizedAddress, 
      username, 
      profilePic !== undefined ? profilePic : null, 
      avatarGender || 'male'
    ]);
    const user = result.rows[0];
    
    res.json({
      address: user.address,
      username: user.username,
      profilePic: user.profile_pic,
      avatarGender: user.avatar_gender,
      score: user.score,
      completedHunts: user.completed_hunts,
      hasCompletedInitialHunt: user.has_completed_initial_hunt,
      lastUpdated: user.last_updated
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: `Failed to update profile: ${error.message}` });
  }
});

app.post('/api/leaderboard/update', async (req, res) => {
  console.log('RECEIVED POST /api/leaderboard/update', req.body);
  const { address, username, scoreIncrement } = req.body;
  
  try {
    if (!address) {
      console.warn('Update failed: Missing address');
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const normalizedAddress = address.toLowerCase();
    console.log(`Updating score for ${normalizedAddress} (username: ${username})`);

    // Upsert logic for PostgreSQL
    const query = `
      INSERT INTO users (address, username, score, completed_hunts, has_completed_initial_hunt, last_updated)
      VALUES ($1, $2, $3, 1, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (address) 
      DO UPDATE SET 
        score = users.score + EXCLUDED.score,
        completed_hunts = users.completed_hunts + 1,
        username = EXCLUDED.username,
        has_completed_initial_hunt = TRUE,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(query, [normalizedAddress, username, scoreIncrement || 0]);
    const player = result.rows[0];
    
    console.log(`Successfully updated player: ${player.username}, score: ${player.score}`);
    res.json({
      address: player.address,
      username: player.username,
      score: player.score,
      completedHunts: player.completed_hunts,
      hasCompletedInitialHunt: player.has_completed_initial_hunt,
      lastUpdated: player.last_updated
    });
  } catch (error: any) {
    console.error('Error updating score route:', error);
    res.status(500).json({ error: `Failed to update score: ${error.message}` });
  }
});

// JSON 404 for API routes to prevent HTML fall-through
app.use('/api', (req, res) => {
  console.warn(`404 - API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('GLOBAL ERROR:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ 
    error: err.message || 'Internal Server Error',
    path: req.url,
    method: req.method
  });
});

async function startServer() {
  // Do not start the standalone server if running on Vercel
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment, skipping app.listen');
    return;
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
