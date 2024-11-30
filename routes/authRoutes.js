const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {protect} = require("../middleware/authMiddleware");
const nodemailer = require('nodemailer');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    console.log('Received login request');

    try {
        // Check if user exists
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({message: 'Invalid credentials'});
        }

        // Check if password matches (you should have a method in the User model for this)
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({message: 'Invalid credentials'});
        }

        // Create payload and sign JWT token using the JWT_SECRET
        const payload = {user: {id: user._id}};

        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'});

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

router.post('/register', async (req, res) => {
    const {name, email, password} = req.body;

    try {
        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({message: 'Please fill in all fields'});
        }

        // Check if user already exists
        const userExists = await User.findOne({email});
        if (userExists) {
            return res.status(400).json({message: 'User already exists'});
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        // Create and sign the JWT token
        const payload = {
            user: {
                id: newUser._id,
            },
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'});

        // Send the response with the token
        res.status(201).json({
            message: 'User registered successfully',
            token,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({message: 'Server error'});
    }
});



// Forgot password API - Generates OTP and sends to email
router.post('/forgot-password', protect,async (req, res) => {

    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
        const otpExpire = Date.now() + 300000; // OTP expires in 5 minutes

        // Store OTP and its expiration in the user's record
        user.otp = otp.toString();
        user.otpExpire = otpExpire;

        await user.save();

        // Send OTP to user's email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const otpMessage = `Your OTP for password reset is: ${otp}. It will expire in 5 minutes.`;

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset OTP',
            text: otpMessage,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent to email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// / API to verify OTP
router.post('/verify-otp', protect,async (req, res) => {
    const { otp } = req.body;  // OTP entered by the user

    const token = req.header('Authorization')?.split(' ')[1]; // Reset token passed in the header

    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }

    try {
        // Find the user based on the reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check if OTP is valid
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if OTP has expired
        if (user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        res.status(200).json({ message: 'OTP verified successfully, you can now create a new password.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// API to reset password
router.post('/reset-password', async (req, res) => {
    const { newPassword } = req.body;  // New password entered by the user
    const token = req.header('Authorization')?.split(' ')[1];  // Reset token passed in the header

    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }

    try {
        // Find the user based on the reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;

        // Clear the reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.otp = undefined;  // Clear OTP after password reset

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;


