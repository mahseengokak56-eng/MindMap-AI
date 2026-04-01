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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mindmap_ai')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Still start server for health-check purposes even if DB fails
    app.listen(PORT, () => console.log(`⚠️  Server running (no DB) on port ${PORT}`));
  });
