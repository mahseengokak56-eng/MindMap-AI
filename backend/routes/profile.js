const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile/emergency
router.put('/emergency', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.emergencyContact = {
      name: name || '',
      phone: phone || ''
    };

    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error('Emergency Contact Save Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
