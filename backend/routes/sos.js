const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// POST /api/sos
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.emergencyContact || !user.emergencyContact.phone) {
      return res.status(400).json({ error: 'No emergency contact configured' });
    }

    // In a real production app, we would use Twilio here:
    // const twilio = require('twilio')(sid, auth);
    // await twilio.messages.create({ ... });

    res.status(200).json({
      success: true,
      message: `SOS Alert triggered for ${user.emergencyContact.name}`,
      contact: user.emergencyContact
    });
  } catch(err) {
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

module.exports = router;
