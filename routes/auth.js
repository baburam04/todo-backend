const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');

// Helper function to create JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h' // Default 1 hour if not set
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    // Validate data
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false,
        message: error.details[0].message 
      });
    }

    // Check if user exists
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword // Store hashed password
    });

    const savedUser = await user.save();
    
    // Generate token
    const token = generateToken(savedUser._id);

    // Omit password in response
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Validate data
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials' // Generic message for security
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials' // Generic message for security
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Omit password in response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

module.exports = router;