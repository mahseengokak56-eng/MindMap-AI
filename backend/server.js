require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON parsing
app.use(express.json());

// CORS — open to all origins for development/deployment compatibility
app.use(cors({ origin: true, credentials: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  if (req.path === '/api/auth/register') {
    console.log(`[${timestamp}] 👤 Registration Attempt: ${req.body?.email || 'No Email'}`);
  } else {
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
  }
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
  const PORT = process.env.PORT || 5000;
  
  if (uri) {
    // 🛡️ SUPER AGGRESSIVE SANITIZE: Remove ALL quotes, spaces, and hidden characters
    uri = uri.replace(/['"\s]+/g, '').trim();
  }

  // 🛡️ SECURITY: Detect placeholder/missing URI
  const isPlaceholder = !uri || uri.includes('<password>') || uri.includes('username:password') || uri.includes('example.com') || uri.length < 10;

  const startMemoryServer = async () => {
    console.log('⚠️ FALLBACK: Starting In-Memory MongoDB (Data will be lost on restart)...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      return mongoServer.getUri();
    } catch(e) {
      console.error('❌ Failed to start memory server:', e);
      return null;
    }
  };

  if (isPlaceholder) {
    console.log('❓ No valid MONGO_URI found.');
    uri = await startMemoryServer();
  }

  const startServer = async (connectionUri) => {
    try {
      const scheme = connectionUri ? connectionUri.split('://')[0].slice(-7) : 'none';
      console.log(`📡 Attempting connection (Scheme ending in: ${scheme})...`);
      
      await mongoose.connect(connectionUri, {
        serverSelectionTimeoutMS: 5000 // 5 second timeout
      });
      console.log('✅ Connected to MongoDB');
      
      if (!app.isRunning) {
        app.listen(PORT, () => {
          console.log(`🚀 Server LIVE on port ${PORT}`);
          app.isRunning = true;
        });
      }
    } catch (err) {
      console.error('❌ Persistent DB Failed:', err.message);
      if (!connectionUri.includes('127.0.0.1')) {
        console.log('🔄 Retrying with Memory Server fallback...');
        const fallbackUri = await startMemoryServer();
        if (fallbackUri) await startServer(fallbackUri);
      } else {
        console.error('❌ CRITICAL: All DB options failed. Backend cannot function.');
      }
    }
  };

  await startServer(uri);
};

connectDB();
