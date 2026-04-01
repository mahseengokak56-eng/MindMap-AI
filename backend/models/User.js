const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    default: 'mock-user'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    default: 'mock@example.com'
  },
  emergencyContact: {
    name: String,
    phone: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
