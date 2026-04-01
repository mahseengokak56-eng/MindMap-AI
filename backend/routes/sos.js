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

    console.log(`🚨 SOS ALERT TRIGGERED 🚨`);
    console.log(`Sending emergency message to: ${user.emergencyContact.name} (${user.emergencyContact.phone})`);
    console.log(`Message Content: "Emergency from MindMap AI: I am feeling extremely overwhelmed and need immediate support. Please contact me."`);

    res.status(200).json({
      success: true,
      message: `SOS Alert sent to ${user.emergencyContact.name}`,
      contact: user.emergencyContact
    });
  } catch(err) {
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

module.exports = router;
