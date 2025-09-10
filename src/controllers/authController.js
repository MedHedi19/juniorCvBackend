const User = require('../models/user');
const { generateToken, generateTokens, verifyRefreshToken } = require('../utils/token');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');

const register = async (req, res) => {
    try {
        const { firstName, lastName, phone, email, password } = req.body;

        if (!firstName || !lastName || !phone || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check for existing email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ 
                message: 'Email address already registered',
                field: 'email',
                error: 'duplicate'
            });
        }
        
        // Check for existing phone number
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ 
                message: 'Phone number already registered',
                field: 'phone',
                error: 'duplicate'
            });
        }

        // Create a new user
        const newUser = new User({ firstName, lastName, phone, email, password, profilePhoto: '', });
        await newUser.save();

        // Send welcome email and handle success/failure
        let emailSent = false;
        let emailError = null;
        
        try {
            // Try with direct nodemailer call
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            const mailOptions = {
                from: `"JuniorsCV Support" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Bienvenue sur JuniorsCV !',
                html: `<!DOCTYPE html><html><head><style>body{font-family:Arial;}</style></head><body><h2>Bienvenue sur JuniorsCV, ${firstName}!</h2><p>Votre compte a été créé avec succès.</p><p>Merci de rejoindre notre communauté!</p></body></html>`
            };
            
            try {
                const info = await transporter.sendMail(mailOptions);
                emailSent = true;
            } catch (err) {
                // Try the regular method as fallback
                const emailResult = await sendWelcomeEmail(email, firstName);
                emailSent = emailResult.success;
            }
        } catch (error) {
            emailError = {
                message: error.message,
                code: error.code || 'UNKNOWN'
            };
            // Don't fail registration if email fails
        }

        // Return success with email status information
        res.status(201).json({ 
            message: 'User registered successfully',
            emailSent: emailSent,
            emailError: emailSent ? null : emailError
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or phone

        if (!identifier || !password) {
            return res.status(400).json({ 
                message: 'Identifier and password are required',
                field: !identifier ? 'identifier' : 'password',
                error: 'required'
            });
        }

        // Find the user by email or phone
        const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        if (!user) {
            return res.status(400).json({ 
                message: 'Email or phone number not found',
                field: 'identifier',
                error: 'not_found'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: 'Incorrect password',
                field: 'password',
                error: 'invalid'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

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

        res.status(200).json({ 
            message: 'Login successful', 
            token: accessToken, 
            refreshToken, 
            user: userData 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
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
            res.status(500).json({ 
                message: 'Failed to send password reset email. Please try again later.' 
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Find user and verify the refresh token matches
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
        
        // Update refresh token in database (invalidates old one)
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({ 
            token: accessToken, 
            refreshToken: newRefreshToken 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            // Find user and clear refresh token
            const user = await User.findOne({ refreshToken });
            if (user) {
                user.refreshToken = undefined;
                await user.save();
            }
        }

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};




module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout,
};