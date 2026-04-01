const mongoose = require('mongoose');

const JournalLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entry: {
    type: String,
    required: true
  },
  sentimentScore: {
    type: Number, // Range from -10 (very negative) to +10 (very positive)
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JournalLog', JournalLogSchema);
