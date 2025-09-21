const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: false, // Made optional for social auth users
        sparse: true // Using sparse index so null/undefined values don't cause uniqueness conflicts
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        minlength: [8, 'Password must be at least 8 characters long'],
    },
    socialAuth: {
        googleId: {
            type: String,
            sparse: true,
        },
        facebookId: {
            type: String,
            sparse: true,
        },
        linkedinId: {
            type: String,
            sparse: true,
        },
    },
    profilePhoto: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true });

// Create sparse indexes to allow multiple null values
userSchema.index({ phone: 1 }, { sparse: true, unique: true });
userSchema.index({ 'socialAuth.googleId': 1 }, { sparse: true, unique: true });
userSchema.index({ 'socialAuth.facebookId': 1 }, { sparse: true, unique: true });
userSchema.index({ 'socialAuth.linkedinId': 1 }, { sparse: true, unique: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;