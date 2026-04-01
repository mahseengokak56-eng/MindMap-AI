const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/auth');

// POST /api/activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { screenTimeHours, sleepHours, studyTimeHours } = req.body;
    
    const newActivity = new ActivityLog({
      userId: req.userId,
      screenTimeHours,
      sleepHours,
      studyTimeHours
    });

    const savedActivity = await newActivity.save();
    res.status(201).json(savedActivity);
  } catch (err) {
    res.status(500).json({ error: 'Server error saving activity', details: err.message });
  }
});

// GET /api/activity
router.get('/', authMiddleware, async (req, res) => {
  try {
    const activities = await ActivityLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(10);
    res.status(200).json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching activities' });
  }
});

module.exports = router;
