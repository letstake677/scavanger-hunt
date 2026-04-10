import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'verse-secret-key';

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
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  address: { type: String, unique: true, sparse: true },
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  completedHunts: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, username } = req.body;
  
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is not connected. Please check your MONGODB_URI in Settings > Secrets.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0]
    });

    await user.save();
    
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { email: user.email, username: user.username, score: user.score } });
  } catch (error: any) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: `Signup failed: ${error.message}` });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { email: user.email, username: user.username, score: user.score, completedHunts: user.completedHunts } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
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
  const { address, username, scoreIncrement, email } = req.body;
  
  try {
    let query = {};
    if (address) query = { address };
    else if (email) query = { email };
    else return res.status(400).json({ error: 'Identifier required' });

    const player = await User.findOneAndUpdate(
      query,
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

// JSON 404 for API routes to prevent HTML fall-through
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
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
