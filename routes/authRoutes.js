const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require("../middleware/mailer");

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = { user: { id: user._id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Server error');
    }
});

// Register route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        const payload = { user: { id: newUser._id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot password - Generates OTP
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpire = Date.now() + 300000;

        user.otp = otp.toString();
        user.otpExpire = otpExpire;

        await user.save();

        await sendEmail(user.email, otp);

        res.status(200).json({ message: 'OTP sent to email' });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { otp, email } = req.body;

    if (!otp || !email) {
        return res.status(400).json({ message: 'Please provide OTP and email' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        res.status(200).json({
            message: 'OTP verified successfully. You can now reset your password.',
        });
    } catch (err) {
        console.error('Error in /verify-otp:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Error in /reset-password:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

