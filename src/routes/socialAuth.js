const express = require('express');
const passport = require('passport');
const { socialLoginCallback } = require('../controllers/socialAuthController');
const router = express.Router();

// Google Auth Routes
router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/social/failure', session: false }),
    socialLoginCallback
);

// Facebook Auth Routes
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/social/failure', session: false }),
    socialLoginCallback
);

// LinkedIn Auth Routes
router.get('/linkedin',
    passport.authenticate('linkedin')
);

router.get('/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/auth/social/failure', session: false }),
    socialLoginCallback
);

// Auth Failure Route
router.get('/social/failure', (req, res) => {
    return res.redirect(`${process.env.MOBILE_APP_URL}/login?error=auth_failed`);
});

module.exports = router;
