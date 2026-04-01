require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow frontend origins (Vercel + local)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors());

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: '🧠 MindMap AI Backend is running!', version: '1.0.0' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mood', require('./routes/moods'));
app.use('/api/activity', require('./routes/activities'));
app.use('/api/predict', require('./routes/predictions').predictRouter);
app.use('/api/suggestions', require('./routes/predictions').suggestionsRouter);
app.use('/api/sos', require('./routes/sos'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running 🚀"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// DB + Server start
const connectDB = async () => {
  let uri = process.env.MONGO_URI;
  
  // If the user hasn't provided a real DB link, we spin up an invisible local DB automatically
  if (!uri || uri.includes('username:password') || uri.includes('cluster0')) {
    console.log('⚠️ No real MONGO_URI detected in .env! Autostarting a temporary In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    } catch(e) {
      console.error('Failed to start memory server:', e);
    }
  }

  try {
    await mongoose.connect(uri || 'mongodb://localhost:27017/mindmap_ai');
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    app.listen(PORT, () => console.log(`⚠️  Server running (no DB) on port ${PORT}`));
  }
};

connectDB();
