const User = require('../models/user');
const { generateToken } = require('../utils/token');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');

const register = async (req, res) => {
    try {
        const { firstName, lastName, phone, email, password } = req.body;

        if (!firstName || !lastName || !phone || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists by email or phone
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or phone' });
        }

        // Create a new user
        const newUser = new User({ firstName, lastName, phone, email, password, profilePhoto: '', });
        await newUser.save();

        // Send welcome email (optional)
        try {
            await sendWelcomeEmail(email, firstName);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError.message);
            // Don't fail registration if email fails
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error)
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or phone

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifier and password are required' });
        }

        // Find the user by email or phone
        const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Prepare user data to return (exclude password)
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            profilePhoto: user.profilePhoto,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        res.status(200).json({ message: 'Login successful', token, user: userData });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with this email address' });
        }

        // Generate reset PIN (4 digits for mobile app)
        const resetPin = Math.floor(1000 + Math.random() * 9000).toString();
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save reset token to user
        user.resetPasswordToken = resetPin;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Send password reset email
        try {
            await sendPasswordResetEmail(email, resetPin, user.firstName);
            
            res.status(200).json({ 
                message: 'Password reset email sent successfully. Please check your email.',
                success: true
            });
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError.message);
            
            // Remove the token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            
            res.status(500).json({ 
                message: 'Failed to send password reset email. Please try again later.' 
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error);
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error);
    }
};




module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
};