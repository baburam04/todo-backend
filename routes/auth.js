const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');

// Register
router.post('/register', async (req, res) => {
  // Validate data
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Check if user already exists
  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) return res.status(400).json({ message: 'Email already exists' });

  // Create new user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  try {
    const savedUser = await user.save();
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  // Validate data
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Check if user exists
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user) return res.status(400).json({ message: 'Email is not found' });

  // Check if password is correct
  const validPass = await user.matchPassword(req.body.password);
  if (!validPass) return res.status(400).json({ message: 'Invalid password' });

  // Create and assign a token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
  res.json({ token });
});

module.exports = router;