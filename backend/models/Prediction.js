const mongoose = require('mongoose');

const TriggerDetailSchema = new mongoose.Schema({
  trigger: { type: String },
  impact:  { type: Number }
}, { _id: false });

const PredictionSchema = new mongoose.Schema({
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['Low Risk', 'Moderate Risk', 'High Risk']
  },
  suggestions: [{ type: String }],
  triggerDetails: [TriggerDetailSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', PredictionSchema);
