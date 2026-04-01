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

    // Handle Streak Logic
    const user = await User.findById(req.userId);
    if (!user) {
      console.error(`[Journal] User not found for ID: ${req.userId}`);
      return res.status(404).json({ error: 'User not found. Your session may have expired or the database was reset. Please re-login.' });
    }

    const now = new Date();
    const lastLog = user.lastLogDate ? new Date(user.lastLogDate) : null;
    
    // Streak logic: check if the last log was exactly yesterday or more
    if (!lastLog) {
      user.currentStreak = 1;
    } else {
      // Calculate day difference at UTC midnight to avoid timezone/hour issues
      const date1 = new Date(lastLog).setHours(0,0,0,0);
      const date2 = new Date(now).setHours(0,0,0,0);
      const diffDays = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.currentStreak += 1;
      } else if (diffDays > 1) {
        user.currentStreak = 1;
      }
      // If diffDays is 0, they already logged today, so we don't change the streak
    }
    
    user.lastLogDate = now;
    await user.save();

    console.log(`[Journal] Entry saved for user ${req.userId}, streak: ${user.currentStreak}`);

    res.status(201).json({ 
      message: 'Journal entry saved', 
      sentimentScore, 
      streak: user.currentStreak 
    });
  } catch (err) {
    console.error('[Journal Error]', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
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
