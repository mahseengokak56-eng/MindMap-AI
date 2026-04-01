const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
