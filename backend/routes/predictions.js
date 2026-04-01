const express = require('express');
const predictRouter = express.Router();
const suggestionsRouter = express.Router();

const MoodLog = require('../models/MoodLog');
const ActivityLog = require('../models/ActivityLog');
const Prediction = require('../models/Prediction');
const authMiddleware = require('../middleware/auth');

// GET /api/predict
predictRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const latestActivity = await ActivityLog.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    const recentMoods = await MoodLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(3);

    let riskScore = 15; 
    const triggerDetails = [];

    if (latestActivity) {
      // Screen Time Calibration
      if (latestActivity.screenTimeHours > 12) {
        riskScore += 35;
        triggerDetails.push({ trigger: 'Extreme Screen Time', impact: 35 });
      } else if (latestActivity.screenTimeHours > 8) {
        riskScore += 20;
        triggerDetails.push({ trigger: 'High Screen Time', impact: 20 });
      }

      // Sleep Calibration (Impactful)
      if (latestActivity.sleepHours < 4) {
        riskScore += 45;
        triggerDetails.push({ trigger: 'Critical Sleep Deprivation', impact: 45 });
      } else if (latestActivity.sleepHours < 6) {
        riskScore += 30;
        triggerDetails.push({ trigger: 'Low Sleep', impact: 30 });
      }

      // Productivity / Study
      if (latestActivity.studyTimeHours > 10) {
        riskScore += 15;
        triggerDetails.push({ trigger: 'Heavy Workload', impact: 15 });
      }

      // Positive offset: Good sleep
      if (latestActivity.sleepHours >= 8) riskScore -= 15;
    }

    // Mood Dynamic Scaling
    const negativeCount = recentMoods.filter(m => m.moodScore <= 2).length;
    if (negativeCount >= 3) {
      riskScore += 45;
      triggerDetails.push({ trigger: 'Severe Emotional Strain', impact: 45 });
    } else if (negativeCount >= 1) {
      const moodImpact = (3 - recentMoods[0].moodScore) * 10 + 5; 
      if (moodImpact > 0) {
        riskScore += moodImpact;
        triggerDetails.push({ trigger: 'Declining Mood', impact: moodImpact });
      }
    }

    // Cap between 5 and 100
    riskScore = Math.max(5, Math.min(100, Math.ceil(riskScore)));

    let status, suggestions;
    if (riskScore >= 70) {
      status = 'High Risk';
      suggestions = [
        '🚨 Urgent: Your wellness markers are critical. Take a complete break.',
        '😴 Prioritize 8+ hours of sleep tonight—it is non-negotiable.',
        '📴 Disconnect from all digital devices for the next 4 hours.'
      ];
    } else if (riskScore >= 40) {
      status = 'Moderate Risk';
      suggestions = [
        '⚠️ You are showing early burnout signs. Slow down.',
        '🚶 A 15-minute walk today will significantly lower your stress.',
        '⏸ Try the Pomodoro technique for work/study sessions.'
      ];
    } else {
      status = 'Low Risk';
      suggestions = [
        '✅ You are doing great! Keep maintaining this balance.',
        '💧 Stay hydrated and stick to your current sleep schedule.',
        '🌿 Plan some "me-time" this weekend to stay refreshed.'
      ];
    }

    const predictionDoc = new Prediction({ 
      userId: req.userId, 
      riskScore, 
      status, 
      suggestions, 
      triggerDetails 
    });
    
    await predictionDoc.save();

    res.status(200).json({ 
      riskScore, 
      status, 
      suggestions, 
      triggerDetails,
      lastCalculatedAt: new Date()
    });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Server error generating prediction' });
  }
});

// GET /api/suggestions
suggestionsRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const latest = await Prediction.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!latest) return res.status(200).json({ suggestions: ['Log your day to get AI suggestions!'] });
    res.status(200).json(latest);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { predictRouter, suggestionsRouter };
