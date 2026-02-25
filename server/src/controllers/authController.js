const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, NODE_ENV } = require('../config/env');
const { encrypt } = require('../utils/encryption');

// Cookie options
const getCookieOptions = () => ({
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
});

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Generate token & set cookie
        const token = generateToken(user._id);
        res.cookie('token', token, getCookieOptions());

        // Return encrypted user data
        const userData = { id: user._id, name: user.name, email: user.email };
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: encrypt(userData),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Generate token & set cookie
        const token = generateToken(user._id);
        res.cookie('token', token, getCookieOptions());

        // Return encrypted user data
        const userData = { id: user._id, name: user.name, email: user.email };
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: encrypt(userData),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    const userData = { id: req.user._id, name: req.user.name, email: req.user.email };
    res.status(200).json({
        success: true,
        data: encrypt(userData),
    });
};
