const express = require('express');
const passport = require('passport');
const { socialLoginCallback } = require('../controllers/socialAuthController');
const router = express.Router();

// Google Auth Routes
router.get('/google', (req, res, next) => {
    console.log('=== GOOGLE AUTH ROUTE ===');
    console.log('Query params:', req.query);
    console.log('redirect_uri from query:', req.query.redirect_uri);
    console.log('Session ID:', req.sessionID);
    console.log('Session before save:', req.session);
    
    if (req.query.redirect_uri) {
        req.session.redirect_uri = req.query.redirect_uri;
        console.log('✅ Saved redirect_uri to session:', req.session.redirect_uri);
    } else {
        console.log('❌ NO redirect_uri in query params!');
    }
    
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        state: req.query.redirect_uri
    })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/social/failure', session: false }),
    (req, res, next) => {
        console.log('=== GOOGLE CALLBACK ===');
        console.log('Session ID:', req.sessionID);
        console.log('Session in callback:', req.session);
        console.log('redirect_uri from session:', req.session?.redirect_uri);
        console.log('state from query:', req.query.state);
        
        if (req.session && req.session.redirect_uri) {
            req.query.redirect_uri = req.session.redirect_uri;
            console.log('✅ Restored redirect_uri to query:', req.query.redirect_uri);
        } else {
            console.log('❌ NO redirect_uri in session! Session may have been lost.');
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