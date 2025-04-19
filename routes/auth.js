const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');

// Helper function to create JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    // Validate and sanitize data
    const validatedData = registerValidation(req.body);

    // Check if user exists
    const emailExists = await User.findOne({ email: validatedData.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Create user
    const user = new User({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword
    });

    const savedUser = await user.save();
    
    // Generate token
    const token = generateToken(savedUser._id);

    // Prepare response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    const statusCode = err.message.includes('validation') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error during registration'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Validate and sanitize data (will automatically remove 'name' if present)
    const { email, password } = loginValidation(req.body);

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Prepare response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    const statusCode = err.message.includes('validation') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Server error during login'
    });
  }
});

module.exports = router;