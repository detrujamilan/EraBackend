const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
const crypto = require('crypto'); // For generating reset token

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure no duplicate emails
    },
    password: {
        type: String,
        required: true,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpire: {
        type: Date,
    },
    otp: {
        type: String, // The 4-digit OTP for password reset
    },
    otpExpire: {
        type: Date, // The expiration time of OTP
    },
});

// Method to compare the plain text password with the hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate a reset password token
UserSchema.methods.generateResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = resetToken;
    this.resetPasswordExpire = Date.now() + 3600000;
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
