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
    passReqToCallback: true
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
          const names = profile.displayName.split(' ');
          const firstName = names[0] || '';
          const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
          
          user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
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
    scope: ['r_emailaddress', 'r_liteprofile'],
    state: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 'socialAuth.linkedinId': profile.id });
      let isNewUser = false;
      
      if (!user) {
        // Check if user with same email exists
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        user = await User.findOne({ email });
        
        if (user) {
          // If user with this email exists, add LinkedIn ID to their account
          user.socialAuth.linkedinId = profile.id;
          await user.save();
        } else {
          // Create new user
          isNewUser = true;
          const names = profile.displayName.split(' ');
          const firstName = names[0] || '';
          const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
          
          user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
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
