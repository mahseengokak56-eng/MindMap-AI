const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  console.log(`[REGISTER ATTEMPT] Name: ${name}, Email: ${email}, Password length: ${password?.length || 0}`);

  try {
    if (!name || !email || !password) {
      console.log('[REGISTER FAILED] Missing fields');
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
      console.log(`[REGISTER FAILED] User already exists: ${email}`);
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({ name, email, password });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log(`[REGISTER SUCCESS] User created: ${email}`);

    // Return JWT
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error('[REGISTRATION ERROR DETAILED]:', {
      message: err.message,
      stack: err.stack,
      dbState: mongoose.connection.readyState // 0: disconnected, 1: connected
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
