const express = require('express');
const router = express.Router();
const MoodLog = require('../models/MoodLog');

// POST /api/mood
router.post('/', async (req, res) => {
  try {
    const { emoji, text, moodScore } = req.body;
    const newMood = new MoodLog({
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
router.get('/history', async (req, res) => {
  try {
    // Get last 7 days of moods. For hackathon, just get all descending and limit
    const moods = await MoodLog.find().sort({ createdAt: -1 }).limit(14);
    res.status(200).json(moods.reverse()); // Chronological for charts
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching moods' });
  }
});

module.exports = router;
