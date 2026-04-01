const express = require('express');
const router = express.Router();
const MoodLog = require('../models/MoodLog');
const authMiddleware = require('../middleware/auth');

// POST /api/mood
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { emoji, text, moodScore } = req.body;
    const newMood = new MoodLog({
      userId: req.userId,
      emoji,
      text,
      moodScore
    });
    
    const savedMood = await newMood.save();
    res.status(201).json(savedMood);
  } catch (err) {
    res.status(500).json({ error: 'Server error saving mood', details: err.message });
  }
});

// GET /api/mood/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // Get last 14 days of moods
    const moods = await MoodLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(14);
    res.status(200).json(moods.reverse()); // Chronological for charts
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching moods' });
  }
});

module.exports = router;
