const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const JournalLog = require('../models/JournalLog');
const User = require('../models/User');

// Simple rule-based sentiment analyzer
const analyzeSentiment = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  const positiveWords = ['happy', 'grateful', 'good', 'great', 'awesome', 'excited', 'peaceful', 'productive', 'rested', 'hopeful'];
  const negativeWords = ['sad', 'stressed', 'overwhelmed', 'anxious', 'tired', 'bad', 'horrible', 'exhausted', 'hopeless', 'frustrated'];
  
  let score = 0;
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 2;
    if (negativeWords.includes(word)) score -= 2;
  });
  
  // Clamp score between -10 and 10
  return Math.max(-10, Math.min(10, score));
};

// POST /api/journal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { entry } = req.body;
    if (!entry) return res.status(400).json({ error: 'Entry is required' });

    const sentimentScore = analyzeSentiment(entry);
    
    const newJournal = new JournalLog({
      userId: req.userId,
      entry,
      sentimentScore
    });

    await newJournal.save();

    // Handle Strak Logic
    const user = await User.findById(req.userId);
    const now = new Date();
    const lastLog = user.lastLogDate ? new Date(user.lastLogDate) : null;
    
    if (!lastLog) {
      user.currentStreak = 1;
    } else {
      const diffDays = Math.floor((now - lastLog) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.currentStreak += 1;
      } else if (diffDays > 1) {
        user.currentStreak = 1;
      }
    }
    
    user.lastLogDate = now;
    await user.save();

    res.status(201).json({ 
      message: 'Journal entry saved', 
      sentimentScore, 
      streak: user.currentStreak 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/journal
router.get('/', authMiddleware, async (req, res) => {
  try {
    const journals = await JournalLog.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
