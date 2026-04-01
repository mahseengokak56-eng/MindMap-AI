const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Prediction = require('../models/Prediction');

// POST /api/chat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Fetch latest prediction score for context
    const latestPrediction = await Prediction.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    const riskScore = latestPrediction ? latestPrediction.riskScore : 0;

    let reply = "I'm here to support you. How are you feeling today?";
    const msg = message.toLowerCase();

    // Rule-based logic
    if (msg.includes('anxious') || msg.includes('stress') || msg.includes('overwhelmed') || msg.includes('panic')) {
      reply = "It sounds like you're carrying a lot right now. Remember to take deep breaths. Ground yourself by looking for 5 things you can see around you.";
    } else if (msg.includes('tired') || msg.includes('exhausted') || msg.includes('sleepy') || msg.includes('fatigue')) {
      reply = "Burnout often starts with exhaustion. Please prioritize genuine rest tonight. Your body is asking for a break.";
    } else if (msg.includes('hospital') || msg.includes('doctor') || msg.includes('clinic') || msg.includes('health care') || msg.includes('healthcare') || msg.includes('medical')) {
      reply = "If you or someone you know is in immediate danger, please call your local emergency services immediately. You can find the nearest healthcare centers by clicking here: https://www.google.com/maps/search/nearest+hospital+or+mental+health+clinic";
    } else if (msg.includes('sad') || msg.includes('depressed') || msg.includes('lonely') || msg.includes('down')) {
      reply = "I'm really sorry you're feeling this way. It's okay to not be okay. If you need immediate support, please reach out to your emergency contact or a professional.";
    } else if (msg.includes('angry') || msg.includes('mad') || msg.includes('frustrated')) {
      reply = "Frustration is a normal human emotion. Try to step away from whatever is causing the stress for just 5 minutes and focus on your breathing.";
    } else if (msg.includes('help')) {
      reply = "I'm here to listen and help you process your stress. You can also press the SOS button to alert your emergency contact if things feel overwhelming.";
    } else if (riskScore > 70) {
      reply = `I notice your burnout risk is quite high right now (${riskScore}/100). Please take my suggestions seriously and try to unplug. How can I best support you in this moment?`;
    } else if (riskScore > 40) {
      reply = `Your risk score is moderate (${riskScore}/100). Keep an eye on your rest and screen time. What's on your mind?`;
    } else {
      reply = "I'm here for you. Whether you want to vent about your day, or just need a gentle reminder to take a break, I'm listening.";
    }

    // Artificial delay to simulate "thinking"
    setTimeout(() => {
      res.status(200).json({ reply });
    }, 1000);

  } catch (err) {
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

module.exports = router;
