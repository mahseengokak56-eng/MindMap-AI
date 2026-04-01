require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    message: '🧠 MindMap AI Backend is live!',
    timestamp: new Date().toISOString()
  });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', db_state: mongoose.connection.readyState });
});

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/mood',        require('./routes/moods'));
app.use('/api/activity',    require('./routes/activities'));
app.use('/api/predict',     require('./routes/predictions').predictRouter);
app.use('/api/suggestions', require('./routes/predictions').suggestionsRouter);
app.use('/api/sos',         require('./routes/sos'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/profile',     require('./routes/profile'));
app.use('/api/journal',     require('./routes/journal'));

// ─── 404 + ERROR HANDLERS ─────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── DATABASE CONNECTION ──────────────────────────────────────
const HARDCODED_MONGO_URI = 'mongodb+srv://mindmap_user:Mindmap123@cluster0.xpjfnzt.mongodb.net/mindmapai?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  // Get URI from env, clean it aggressively, fall back to hardcoded
  let uri = process.env.MONGO_URI || '';
  uri = uri.replace(/[\s'"]+/g, '').trim();

  const isValid = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
  const finalUri = isValid ? uri : HARDCODED_MONGO_URI;

  console.log(`📡 Connecting to MongoDB... (using ${isValid ? 'ENV uri' : 'HARDCODED uri'})`);

  try {
    await mongoose.connect(finalUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB Connected!');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    // Try without SRV (plain TCP) as last resort
    const plainUri = finalUri.replace('mongodb+srv://', 'mongodb://');
    try {
      console.log('🔄 Retrying with plain mongodb:// ...');
      await mongoose.connect(plainUri, { serverSelectionTimeoutMS: 8000 });
      console.log('✅ MongoDB Connected (plain)!');
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err2) {
      console.error('❌ All DB connections failed. Server will still start.');
      // Start server anyway so Render doesn't kill it
      app.listen(PORT, () => console.log(`🚀 Server running (no DB) on port ${PORT}`));
    }
  }
};

connectDB();
