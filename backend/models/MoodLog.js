const mongoose = require('mongoose');

const MoodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  text: {
    type: String
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    // Example: 1 = Awful, ... 5 = Awesome
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MoodLog', MoodLogSchema);
