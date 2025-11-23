const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/user');

// Load environment variables
require('dotenv').config();

module.exports = function(app) {
  // Initialize passport
  app.use(passport.initialize());

  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + '/auth/google/callback',
    profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
    passReqToCallback: true,
    proxy: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 'socialAuth.googleId': profile.id });
      let isNewUser = false;
      
      if (!user) {
        // Check if user with same email exists
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        user = await User.findOne({ email });
        
        if (user) {
          // If user with this email exists, add Google ID to their account
          user.socialAuth.googleId = profile.id;
          await user.save();
        } else {
          // Create new user
          isNewUser = true;
          
          // Try to get names from profile.name first, fallback to displayName
          let firstName = '';
          let lastName = '';
          
          if (profile.name) {
            firstName = profile.name.givenName || '';
            lastName = profile.name.familyName || '';
          }
          
          // Fallback to parsing displayName if name object not available
          if (!firstName && profile.displayName) {
            const names = profile.displayName.split(' ');
            firstName = names[0] || '';
            lastName = names.length > 1 ? names.slice(1).join(' ') : '';
          }
          
          // Ensure we have at least something for required fields
          firstName = firstName || 'User';
          lastName = lastName || 'Name';
          
          user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: undefined, // Temporary unique phone for Google users
            profilePhoto: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            socialAuth: {
              googleId: profile.id
            }
          });
          
          await user.save();
        }
      }
      
      // Set flags in the request object
      req.isNewUser = isNewUser;
      req.provider = 'google';
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.BASE_URL + '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
    enableProof: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 'socialAuth.facebookId': profile.id });
      let isNewUser = false;
      
      if (!user) {
        // Check if user with same email exists
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        user = await User.findOne({ email });
        
        if (user) {
          // If user with this email exists, add Facebook ID to their account
          user.socialAuth.facebookId = profile.id;
          await user.save();
        } else {
          // Create new user
          isNewUser = true;
          user = new User({
            firstName: profile.name.givenName || '',
            lastName: profile.name.familyName || '',
            email: email,
            phone: `facebook_${profile.id}`, // Temporary unique phone for Facebook users
            profilePhoto: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            socialAuth: {
              facebookId: profile.id
            }
          });
          
          await user.save();
        }
      }
      
      // Set flags in the request object
      req.isNewUser = isNewUser;
      req.provider = 'facebook';
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // LinkedIn Strategy
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + '/auth/linkedin/callback',
    scope: ['openid', 'profile'], // Temporarily remove 'email' until approved
    state: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 'socialAuth.linkedinId': profile.id });
      let isNewUser = false;
      
      if (!user) {
        // Check if user with same email exists (email might not be available if scope not approved)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        user = email ? await User.findOne({ email }) : null;
        
        if (user) {
          // If user with this email exists, add LinkedIn ID to their account
          user.socialAuth.linkedinId = profile.id;
          await user.save();
        } else {
          // Create new user
          isNewUser = true;
          
          // Try to get names from profile.name first, fallback to displayName
          let firstName = '';
          let lastName = '';
          
          if (profile.name) {
            firstName = profile.name.givenName || '';
            lastName = profile.name.familyName || '';
          }
          
          // Fallback to parsing displayName if name object not available
          if (!firstName && profile.displayName) {
            const names = profile.displayName.split(' ');
            firstName = names[0] || '';
            lastName = names.length > 1 ? names.slice(1).join(' ') : '';
          }
          
          // Ensure we have at least something for required fields
          firstName = firstName || 'User';
          lastName = lastName || 'Name';
          
          user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: `linkedin_${profile.id}`, // Temporary unique phone for LinkedIn users
            profilePhoto: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            socialAuth: {
              linkedinId: profile.id
            }
          });
          
          await user.save();
        }
      }
      
      // Set flags in the request object
      req.isNewUser = isNewUser;
      req.provider = 'linkedin';
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
};
