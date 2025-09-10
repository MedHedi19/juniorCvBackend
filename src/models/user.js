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
        required: function() {
            // Phone is required only for regular signup
            return !this.socialAuth.googleId && !this.socialAuth.facebookId && !this.socialAuth.linkedinId;
        },
        // Using sparse index so null/undefined values don't cause uniqueness conflicts
        index: { unique: true, sparse: true },
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
        required: function() {
            // Password is required only for regular signup
            return !this.socialAuth.googleId && !this.socialAuth.facebookId && !this.socialAuth.linkedinId;
        },
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