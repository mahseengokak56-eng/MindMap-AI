const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'mock-user-123'
  },
  screenTimeHours: {
    type: Number,
    required: true,
    min: 0
  },
  sleepHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  studyTimeHours: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
