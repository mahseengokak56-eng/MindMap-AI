const express = require('express');
const router = express.Router();

// POST /api/sos
// Mock SOS trigger endpoint
router.post('/', async (req, res) => {
  try {
    // In a real app, this would integrate with Twilio or Email API
    // e.g. sendSMS("+123456789", "SOS Emergency Alert from MindMap AI User!");
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.status(200).json({
      success: true,
      message: 'SOS Alert triggered. Emergency contact has been notified.'
    });
  } catch(err) {
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
});

module.exports = router;
