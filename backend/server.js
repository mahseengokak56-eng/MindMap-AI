require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — open to all origins for development/deployment compatibility
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cors({ origin: true, credentials: true }));

// Registration debug logging
app.use((req, res, next) => {
  if (req.path === '/api/auth/register') {
    console.log(`[AUTH DEBUG] New Registration Attempt: ${req.body?.email || 'No Email'}`);
  }
  next();
});

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check for Deployment (Render/Vercel)
app.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({ 
    status: 'online', 
    db: dbState === 1 ? 'Connected' : 'Disconnected',
    message: '🧠 MindMap AI Backend is live!', 
    timestamp: new Date().toISOString() 
  });
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
app.use('/api/journal', require('./routes/journal'));

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
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  
  // 🛡️ SECURITY: Prevent 'fake' DB in production
  const isPlaceholder = !uri || uri.includes('<password>') || uri.includes('username:password') || uri.includes('example.com');

  if (isPlaceholder) {
    if (isProduction) {
      console.error('❌ CRITICAL: No real MONGO_URI provided in Production! Backend cannot start.');
      process.exit(1);
    } else {
      console.log('⚠️ Development Mode: Autostarting In-Memory MongoDB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
      } catch(e) {
        console.error('Failed to start memory server:', e);
      }
    }
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB (Persistent)');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB Connection Failure:', err.message);
    if (isProduction) process.exit(1);
  }
};

connectDB();
