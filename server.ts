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

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/verse-scavenger';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  completedHunts: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// API Routes
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topPlayers = await Leaderboard.find()
      .sort({ score: -1 })
      .limit(10);
    res.json(topPlayers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/api/leaderboard/update', async (req, res) => {
  const { address, username, scoreIncrement } = req.body;
  
  if (!address || !username) {
    return res.status(400).json({ error: 'Address and username are required' });
  }

  try {
    const player = await Leaderboard.findOneAndUpdate(
      { address },
      { 
        $inc: { score: scoreIncrement || 0, completedHunts: 1 },
        $set: { username, lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
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
