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

    let riskScore = 0;
    const triggerDetails = [];

    // Trigger 1: High Screen Time (> 8 hours) → +20
    if (latestActivity && latestActivity.screenTimeHours > 8) {
      riskScore += 20;
      triggerDetails.push({ trigger: 'High Screen Time', impact: 20 });
    }

    // Trigger 2: Very High Screen Time (> 12 hours) → additional +10
    if (latestActivity && latestActivity.screenTimeHours > 12) {
      riskScore += 10;
      triggerDetails.push({ trigger: 'Extreme Screen Time', impact: 10 });
    }

    // Trigger 3: Low Sleep (< 6 hours) → +30
    if (latestActivity && latestActivity.sleepHours < 6) {
      riskScore += 30;
      triggerDetails.push({ trigger: 'Low Sleep', impact: 30 });
    }

    // Trigger 4: Very Low Sleep (< 4 hours) → additional +10
    if (latestActivity && latestActivity.sleepHours < 4) {
      riskScore += 10;
      triggerDetails.push({ trigger: 'Critical Sleep Deprivation', impact: 10 });
    }

    // Trigger 5: High Study Time (> 10 hours) → +10
    if (latestActivity && latestActivity.studyTimeHours > 10) {
      riskScore += 10;
      triggerDetails.push({ trigger: 'Overwork / Study Burnout', impact: 10 });
    }

    // Trigger 6: Negative Mood Streak
    let negativeStreaks = 0;
    recentMoods.forEach(mood => {
      if (mood.moodScore <= 2) negativeStreaks++;
    });

    if (negativeStreaks >= 3) {
      riskScore += 40;
      triggerDetails.push({ trigger: 'Negative Mood Streak (3 days)', impact: 40 });
    } else if (negativeStreaks === 2) {
      riskScore += 20;
      triggerDetails.push({ trigger: 'Negative Mood Streak (2 days)', impact: 20 });
    } else if (negativeStreaks === 1) {
      riskScore += 10;
      triggerDetails.push({ trigger: 'Declining Mood', impact: 10 });
    }

    // Positive offset: Good sleep
    if (latestActivity && latestActivity.sleepHours >= 8) {
      riskScore -= 10;
    }

    // Cap between 0 and 100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine status & suggestions
    let status, suggestions;

    if (riskScore >= 70) {
      status = 'High Risk';
      suggestions = [
        '🚨 Your mental health needs urgent attention — take a full rest day.',
        '📴 Disconnect from screens for at least 4 hours today.',
        '😴 Prioritize 8+ hours of sleep tonight — it\'s non-negotiable.',
        '🧘 Try a 10-minute breathing exercise to reduce cortisol.',
        '📞 Talk to someone you trust — you don\'t have to carry this alone.'
      ];
    } else if (riskScore >= 40) {
      status = 'Moderate Risk';
      suggestions = [
        '⚠️ You\'re showing early burnout signs — act now before it worsens.',
        '📱 Put your phone away 1 hour before bed to improve sleep quality.',
        '⏸ Take the Pomodoro break: 25 min work, 5 min rest.',
        '🚶 A 15-minute walk outside can reduce stress hormones by 20%.',
        '📓 Journal your thoughts tonight — release what\'s weighing you down.'
      ];
    } else {
      status = 'Low Risk';
      suggestions = [
        '✅ You\'re doing well! Keep up the healthy rhythm.',
        '💧 Stay hydrated and maintain your sleep schedule.',
        '🎯 Plan your week ahead to stay ahead of stress.',
        '🌿 Keep your screen time balanced — your brain will thank you.'
      ];
    }

    // Save prediction
    const predictionDoc = new Prediction({ userId: req.userId, riskScore, status, suggestions, triggerDetails });
    await predictionDoc.save();

    res.status(200).json({ riskScore, status, suggestions, triggerDetails });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Server error generating burnout prediction', details: err.message });
  }
});

// GET /api/suggestions
suggestionsRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const latestPrediction = await Prediction.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!latestPrediction) {
      return res.status(200).json({
        suggestions: ['Start tracking your moods and activities to get personalized suggestions!']
      });
    }
    res.status(200).json({ suggestions: latestPrediction.suggestions, riskScore: latestPrediction.riskScore, status: latestPrediction.status });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching suggestions' });
  }
});

module.exports = { predictRouter, suggestionsRouter };
