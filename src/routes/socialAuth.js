const express = require('express');
const passport = require('passport');
const { socialLoginCallback } = require('../controllers/socialAuthController');
const router = express.Router();

// Google Auth Routes
router.get('/google', (req, res, next) => {
    // Store the redirect_uri in the session if provided
    if (req.query.redirect_uri) {
        req.session.redirect_uri = req.query.redirect_uri;
    }
    
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        state: req.query.redirect_uri // Pass the redirect_uri as state for extra security
    })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/social/failure', session: false }),
    (req, res, next) => {
        // Pass along any redirect_uri that was stored in the session
        if (req.session && req.session.redirect_uri) {
            req.query.redirect_uri = req.session.redirect_uri;
        }
        next();
    },
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
