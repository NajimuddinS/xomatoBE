const User = require('../models/user.js');
const Restaurant = require('../models/restaurant.js');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/roles');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, address, phone } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      role: role || ROLES.USER,
      address,
      phone,
    });

    await user.save();

    // If role is restaurant, create a restaurant profile
    if (user.role === ROLES.RESTAURANT) {
      const restaurant = new Restaurant({
        name: `${user.name}'s Restaurant`,
        owner: user._id,
        location: user.address || '',
      });
      await restaurant.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user.role === ROLES.RESTAURANT) {
      const restaurant = await Restaurant.findOne({ owner: user._id });
      return res.json({ ...user._doc, restaurant });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};