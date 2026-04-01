const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// POST /api/sos
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      console.error(`[SOS] User not found: ${req.userId}`);
      return res.status(400).json({ error: 'User not found' });
    }
    
    if (!user.emergencyContact || !user.emergencyContact.phone) {
      console.log(`[SOS] No emergency contact configured for user: ${req.userId}`);
      return res.status(400).json({ error: 'No emergency contact configured. Please set an emergency contact in settings first.' });
    }

    console.log(`🚨 SOS ALERT TRIGGERED by user ${req.userId} 🚨`);
    console.log(`Sending emergency message to: ${user.emergencyContact.name} (${user.emergencyContact.phone})`);

    res.status(200).json({
      success: true,
      message: `SOS Alert ready for ${user.emergencyContact.name}`,
      contact: user.emergencyContact
    });
  } catch(err) {
    console.error('[SOS Error]', err.message);
    res.status(500).json({ error: 'Failed to trigger SOS', details: err.message });
  }
});

module.exports = router;
