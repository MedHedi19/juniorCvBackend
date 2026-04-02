const { generateTokens } = require('../utils/token');
const { sendSocialWelcomeEmail } = require('../utils/emailService');
const appleSigninAuth = require('apple-signin-auth');
const User = require('../models/user');

const buildUserPayload = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  email: user.email,
  profilePhoto: user.profilePhoto,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeName = (value, fallback) => {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

// Function to handle successful social authentication
const socialLoginCallback = async (req, res) => {
  try {
    const user = req.user;
    const isNewUser = req.isNewUser;
    const provider = req.provider;

    console.log(`[Social Auth] ${provider} callback received`);
    console.log(`[Social Auth] User ID: ${user?._id}`);
    console.log(`[Social Auth] Is new user: ${isNewUser}`);

    if (!user) {
      console.error('[Social Auth] No user found in request');
      return res.redirect(
        `juniorscv:///auth/callback?error=${encodeURIComponent('Authentication failed')}`
      );
    }

    // Generate tokens for the user
    const { accessToken, refreshToken } = generateTokens(user._id);
    console.log(`[Social Auth] Tokens generated successfully`);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    console.log(`[Social Auth] Refresh token saved to user`);

    // Send welcome email for new users
    if (isNewUser) {
      try {
        await sendSocialWelcomeEmail(user.email, user.firstName, provider);
        console.log(`[Social Auth] Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.warn(`[Social Auth] Welcome email failed:`, emailError.message);
        // Don't fail login if email fails
      }
    }

    // Prepare user data to return (exclude sensitive fields)
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

    console.log(`[Social Auth] User data prepared:`, {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
    });

    // Determine redirect URL based on client type
    const userAgent = req.headers['user-agent'] || '';
    const isExpoClient = userAgent.includes('Expo') || userAgent.includes('expo');

    console.log(`[Social Auth] User Agent: ${userAgent}`);
    console.log(`[Social Auth] Is Expo Client: ${isExpoClient}`);

    // Prepare the query params with proper encoding
    const tokenParam = `token=${encodeURIComponent(accessToken)}`;
    const refreshTokenParam = `refreshToken=${encodeURIComponent(refreshToken)}`;
    const userParam = `user=${encodeURIComponent(JSON.stringify(userData))}`;
    const queryParams = `${tokenParam}&${refreshTokenParam}&${userParam}`;

    let redirectUrl;

    // Get redirect_uri from multiple sources (state parameter is most reliable)
    const frontendRedirectUri =
      req.query.redirect_uri || req.query.state || req.session?.redirect_uri;

    console.log(`[Social Auth] Checking redirect_uri from query:`, req.query.redirect_uri);
    console.log(`[Social Auth] Checking state parameter:`, req.query.state);
    console.log(`[Social Auth] Checking session:`, req.session?.redirect_uri);
    console.log(`[Social Auth] Final frontendRedirectUri:`, frontendRedirectUri);

    if (frontendRedirectUri) {
      // Use the redirect URI provided by the frontend
      redirectUrl = `${frontendRedirectUri}?${queryParams}`;
      console.log(`[Social Auth] ✅ Using redirect URI:`, frontendRedirectUri);
    } else {
      // Fallback logic
      const userAgent = req.headers['user-agent'] || '';
      const isExpoClient = userAgent.includes('Expo') || userAgent.includes('expo');

      if (isExpoClient && process.env.NODE_ENV === 'development') {
        const redirectUri =
          process.env.EXPO_REDIRECT_URI ||
          'exp://pl7eiha-med_hedi-8081.exp.direct/--/auth/callback';
        redirectUrl = `${redirectUri}?${queryParams}`;
      } else {
        const baseUrl = process.env.MOBILE_APP_URL || 'juniorscv://';
        redirectUrl = `${baseUrl}auth/callback?${queryParams}`;
      }
    }

    console.log(`[Social Auth] 🎯 FINAL REDIRECT URL:`, redirectUrl);

    // Log the final redirect URL (without sensitive data)
    console.log(
      `[Social Auth] Final redirect URL structure:`,
      redirectUrl.split('?')[0] + '?[PARAMS_HIDDEN]'
    );

    // Additional validation before redirect
    if (!accessToken || !refreshToken || !userData.id) {
      console.error(`[Social Auth] Missing required data:`, {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUserId: !!userData.id,
      });
      return res.redirect(
        `juniorscv:///auth/callback?error=${encodeURIComponent('Missing authentication data')}`
      );
    }

    // Set appropriate headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error(`[Social Auth] Callback error:`, error);
    console.error(`[Social Auth] Error stack:`, error.stack);

    // Provide more specific error information
    const errorMessage = error.message || 'server_error';
    return res.redirect(`juniorscv:///auth/callback?error=${encodeURIComponent(errorMessage)}`);
  }
};

const appleMobileLogin = async (req, res) => {
  try {
    const {
      identityToken,
      user: appleUser,
      email: emailFromClient,
      firstName: firstNameFromClient,
      lastName: lastNameFromClient,
    } = req.body;

    if (!identityToken) {
      return res.status(400).json({ message: 'Apple identity token is required' });
    }

    const primaryAudience = process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID;
    const extraAudiences = (process.env.APPLE_ALLOWED_AUDIENCES || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const audiences = [primaryAudience, ...extraAudiences].filter(Boolean);

    if (audiences.length === 0) {
      return res.status(500).json({ message: 'Apple Sign-In is not configured on server' });
    }

    const appleProfile = await appleSigninAuth.verifyIdToken(identityToken, {
      audience: audiences.length === 1 ? audiences[0] : audiences,
      ignoreExpiration: false,
    });

    const appleId = appleProfile.sub;
    const email = appleProfile.email || emailFromClient;

    if (!appleId) {
      return res.status(400).json({ message: 'Invalid Apple token payload' });
    }

    let user = await User.findOne({ 'socialAuth.appleId': appleId });
    let isNewUser = false;

    if (!user) {
      if (!email) {
        return res.status(400).json({
          message: 'Apple account email is required on first sign in',
        });
      }

      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        user.socialAuth = user.socialAuth || {};
        user.socialAuth.appleId = appleId;
        await user.save();
      } else {
        isNewUser = true;

        const firstName = normalizeName(firstNameFromClient, 'Apple');
        const lastName = normalizeName(lastNameFromClient, 'User');

        user = new User({
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: undefined,
          profilePhoto: '',
          socialAuth: {
            appleId,
          },
        });

        await user.save();
      }
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    if (isNewUser) {
      try {
        await sendSocialWelcomeEmail(user.email, user.firstName, 'apple');
      } catch (emailError) {
        console.warn('[Apple Auth] Welcome email failed:', emailError.message);
      }
    }

    return res.status(200).json({
      message: 'Apple login successful',
      token: accessToken,
      refreshToken,
      user: buildUserPayload(user),
      provider: 'apple',
      appleUser,
    });
  } catch (error) {
    console.error('[Apple Auth] Mobile login error:', error);
    return res.status(401).json({
      message: 'Apple authentication failed',
      error: error.message,
    });
  }
};

module.exports = { socialLoginCallback, appleMobileLogin };
