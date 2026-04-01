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

    let riskScore = 15; // Baseline 15 for visibility
    const triggerDetails = [];

    console.log(`[Prediction Engine] Analyzing for User: ${req.userId}`);

    if (latestActivity) {
      // Screen Time
      if (latestActivity.screenTimeHours > 12) {
        riskScore += 30;
        triggerDetails.push({ trigger: 'Extreme Screen Time', impact: 30 });
      } else if (latestActivity.screenTimeHours > 8) {
        riskScore += 20;
        triggerDetails.push({ trigger: 'High Screen Time', impact: 20 });
      }

      // Sleep
      if (latestActivity.sleepHours < 4) {
        riskScore += 40;
        triggerDetails.push({ trigger: 'Critical Sleep Deprivation', impact: 40 });
      } else if (latestActivity.sleepHours < 6) {
        riskScore += 30;
        triggerDetails.push({ trigger: 'Low Sleep', impact: 30 });
      }

      // Study
      if (latestActivity.studyTimeHours > 10) {
        riskScore += 15;
        triggerDetails.push({ trigger: 'Heavy Workload', impact: 15 });
      }

      // Positive offset: Good sleep
      if (latestActivity.sleepHours >= 8) riskScore -= 10;
    }

    // Mood Patterns
    let negativeCount = 0;
    recentMoods.forEach(m => { if (m.moodScore <= 2) negativeCount++; });

    if (negativeCount >= 3) {
      riskScore += 40;
      triggerDetails.push({ trigger: 'Persistent Negative Mood', impact: 40 });
    } else if (negativeCount >= 1) {
      riskScore += 15;
      triggerDetails.push({ trigger: 'Declining Mood', impact: 15 });
    }

    // Cap between 5 and 100 (keep it visible)
    riskScore = Math.max(5, Math.min(100, riskScore));

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

    const predictionDoc = new Prediction({ userId: req.userId, riskScore, status, suggestions, triggerDetails });
    await predictionDoc.save();

    res.status(200).json({ riskScore, status, suggestions, triggerDetails });
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
