const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// POST /api/activity
router.post('/', async (req, res) => {
  try {
    const { screenTimeHours, sleepHours, studyTimeHours } = req.body;
    
    const newActivity = new ActivityLog({
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
router.get('/', async (req, res) => {
  try {
    const activities = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching activities' });
  }
});

module.exports = router;
