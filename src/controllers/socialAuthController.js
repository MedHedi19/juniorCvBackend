const { generateTokens } = require('../utils/token');
const { sendSocialWelcomeEmail } = require('../utils/emailService');

// Function to handle successful social authentication
const socialLoginCallback = async (req, res) => {
    try {
        const user = req.user;
        const isNewUser = req.isNewUser; // Flag set by Passport strategy
        const provider = req.provider; // Provider name set by Passport strategy
        
        if (!user) {
            return res.redirect(`${process.env.MOBILE_APP_URL}/login?error=auth_failed`);
        }
        
        // Generate tokens for the user
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();
        
        // Send welcome email for new users
        if (isNewUser) {
            try {
                await sendSocialWelcomeEmail(user.email, user.firstName, provider);
            } catch (emailError) {
                // Don't fail login if email fails
            }
        }
        
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
        
        // Determine if the request is coming from Expo Go client
        const userAgent = req.headers['user-agent'] || '';
        const isExpoClient = userAgent.includes('Expo') || userAgent.includes('expo');
        
        // Prepare the query params
        const queryParams = `token=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        
        let redirectUrl;
        
        if (isExpoClient) {
            // For Expo Auth Session, use the expo-auth-session redirect URL
            // Get the redirect URI from the request query or state, or use a fallback
            const redirectUri = req.query.redirect_uri || 
                               (req.query.state ? decodeURIComponent(req.query.state) : null) || 
                               process.env.EXPO_REDIRECT_URI || 
                               'exp://exp.host/@med_hedi/JuniorsCV';
                               
            redirectUrl = `${redirectUri}/--/auth/callback?${queryParams}`;
            console.log('Redirecting to Expo Auth Session URL:', redirectUrl);
        } else {
            // For standalone app, use the deep link
            redirectUrl = `${process.env.MOBILE_APP_URL}/auth/callback?${queryParams}`;
            console.log('Redirecting to app URL:', redirectUrl);
        }
        
        return res.redirect(redirectUrl);
    } catch (error) {
        return res.redirect(`${process.env.MOBILE_APP_URL}/login?error=server_error`);
    }
};

module.exports = {
    socialLoginCallback
};
