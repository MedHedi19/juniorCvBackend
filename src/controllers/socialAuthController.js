const { generateTokens } = require('../utils/token');
const { sendSocialWelcomeEmail } = require('../utils/emailService');

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
            return res.redirect(`juniorscv:///auth/callback?error=${encodeURIComponent('Authentication failed')}`);
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
            firstName: userData.firstName
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
        // First check for redirect_uri from the request (passed from frontend)
const frontendRedirectUri = req.query.redirect_uri || req.session?.redirect_uri;

if (frontendRedirectUri) {
    // Use the redirect URI provided by the frontend (it already includes the path)
    redirectUrl = `${frontendRedirectUri}?${queryParams}`;
    console.log(`[Social Auth] Using frontend redirect URI: ${redirectUrl}`);
}
        
        else if (isExpoClient && process.env.NODE_ENV === 'development') {
    // Fallback for Expo development
    const redirectUri = process.env.EXPO_REDIRECT_URI || 'exp://pl7eiha-med_hedi-8081.exp.direct/--/auth/callback';
    redirectUrl = `${redirectUri}?${queryParams}`;
    console.log(`[Social Auth] Using fallback Expo redirect: ${redirectUrl}`);
} else {
    // For standalone app and production
    const baseUrl = process.env.MOBILE_APP_URL || 'juniorscv://';
    redirectUrl = `${baseUrl}auth/callback?${queryParams}`;
    console.log(`[Social Auth] Using production redirect: ${redirectUrl}`);
}

        
        // Log the final redirect URL (without sensitive data)
        console.log(`[Social Auth] Final redirect URL structure:`, redirectUrl.split('?')[0] + '?[PARAMS_HIDDEN]');
        
        // Additional validation before redirect
        if (!accessToken || !refreshToken || !userData.id) {
            console.error(`[Social Auth] Missing required data:`, {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                hasUserId: !!userData.id
            });
            return res.redirect(`juniorscv:///auth/callback?error=${encodeURIComponent('Missing authentication data')}`);
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

module.exports = { socialLoginCallback };