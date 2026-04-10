import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/verse-scavenger';

if (!process.env.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI environment variable is not set. Using local fallback.');
} else {
  if (process.env.MONGODB_URI.includes('<') || process.env.MONGODB_URI.includes('>')) {
    console.error('CRITICAL ERROR: Your MONGODB_URI contains "<" or ">" characters. Please remove them from your password in Settings > Secrets.');
  }
  console.log('MONGODB_URI is set. Attempting to connect...');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => {
    console.error('CRITICAL: MongoDB connection error details:', err.message);
  });

// User Schema
const userSchema = new mongoose.Schema({
  address: { type: String, unique: true, sparse: true },
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  completedHunts: { type: Number, default: 0 },
  hasCompletedInitialHunt: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// User Status Route
app.get('/api/user/:address', async (req, res) => {
  try {
    const normalizedAddress = req.params.address.toLowerCase();
    const user = await User.findOne({ address: normalizedAddress });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Leaderboard Routes
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topPlayers = await User.find()
      .sort({ score: -1 })
      .limit(10);
    res.json(topPlayers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
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
    
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database connection is not ready. Please try again in a few seconds.' });
    }

    const normalizedAddress = address.toLowerCase();
    console.log(`Updating score for ${normalizedAddress} (username: ${username})`);

    const player = await User.findOneAndUpdate(
      { address: normalizedAddress },
      { 
        $inc: { score: scoreIncrement || 0, completedHunts: 1 },
        $set: { 
          username, 
          lastUpdated: new Date(),
          hasCompletedInitialHunt: true 
        }
      },
      { upsert: true, new: true }
    );
    
    console.log(`Successfully updated player: ${player.username}, score: ${player.score}`);
    res.json(player);
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
