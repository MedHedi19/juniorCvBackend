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
        
        // Always check for Expo development URL first - this is crucial for Expo Go testing
        // Prepare the query params
        const queryParams = `token=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        
        let redirectUrl;
        
        // For Expo Go client during development, ALWAYS try to use the DEV_REDIRECT_URL first
        if (process.env.DEV_REDIRECT_URL) {
            redirectUrl = `${process.env.DEV_REDIRECT_URL}/auth/callback?${queryParams}`;
            console.log('⚠️ Redirecting to Expo Go development URL:', redirectUrl);
        } else if (process.env.MOBILE_APP_URL) {
            // For standalone app or production, use the deep link
            redirectUrl = `${process.env.MOBILE_APP_URL}/auth/callback?${queryParams}`;
            console.log('📱 Redirecting to native app URL:', redirectUrl);
        } else {
            // Fallback to a default URL if none of the above are set
            redirectUrl = `http://localhost:19006/auth/callback?${queryParams}`;
            console.log('⚠️ Using fallback URL:', redirectUrl);
        }
        
        // Log the URLs from environment for debugging
        console.log('Environment URLs:', {
            DEV_REDIRECT_URL: process.env.DEV_REDIRECT_URL,
            MOBILE_APP_URL: process.env.MOBILE_APP_URL
        });
        
        return res.redirect(redirectUrl);
    } catch (error) {
        return res.redirect(`${process.env.MOBILE_APP_URL}/login?error=server_error`);
    }
};

module.exports = {
    socialLoginCallback
};
