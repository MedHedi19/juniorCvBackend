# Google OAuth Setup Guide for JuniorCV

This guide will help you set up Google OAuth for testing the social authentication in your JuniorCV application.

## 1. Create OAuth 2.0 Credentials in Google Cloud Console

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Set a name for your OAuth client, e.g., "JuniorCV Development"
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - Add any other environments if needed (staging, production)
8. Click "Create" to generate your client ID and client secret

## 2. Configure Your Application

Add the following environment variables to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Application URLs (required for redirect after authentication)
MOBILE_APP_URL=Juniorscv://
BASE_URL=http://localhost:3000
```

These variables are required for Google authentication to work properly:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials
- `MOBILE_APP_URL`: The URL of your mobile app (or frontend) where users will be redirected after authentication
- `BASE_URL`: The URL of your backend server, used to construct callback URLs

## 3. Testing Google Authentication

### Option 1: Using the Test Client

1. Make sure your server is running on port 3001 (or update the BACKEND_URL in the test client)
2. Run the test client:

```bash
node test-google-auth.js
```

1. Click the "Login with Google" button in the browser window that opens
2. Complete the Google authentication flow

### Option 2: Manual Testing

1. Open a browser and navigate to: `http://localhost:3001/auth/google`
2. Complete the Google authentication flow
3. Check if you're redirected back to your application with a token

### Option 3: Running Integration Tests

Run the integration tests with:

```bash
npm test __tests__/integration/googleAuth.test.js
```

## Troubleshooting

- **Redirect URI Mismatch**: Ensure the callback URL in your Google Cloud Console matches exactly with your application's callback route
- **"Error: invalid_request"**: Check that your client ID and client secret are correctly set in your .env file
- **"Error: redirect_uri_mismatch"**: Verify that the redirect URI in your Google Cloud Console exactly matches your callback URL
