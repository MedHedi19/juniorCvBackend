# Apple Sign-In Setup (iOS + Backend)

This document describes how to configure Sign in with Apple for the mobile app and backend API.

## 1) Backend Environment Variables

Add these variables in backend `.env`:

```env
APPLE_CLIENT_ID=com.JuniorsCV.app
# Optional alias used by code (one of the two must exist)
APPLE_BUNDLE_ID=com.JuniorsCV.app
# Optional (comma-separated): additional accepted audiences for development only
# Example for Expo Go testing:
# APPLE_ALLOWED_AUDIENCES=host.exp.Exponent
```

`APPLE_CLIENT_ID` must match your iOS bundle identifier and Apple Service ID audience expected in Apple ID token.

`APPLE_ALLOWED_AUDIENCES` can be used to accept extra token audiences (for example `host.exp.Exponent` while testing in Expo Go). Keep this empty in production unless you explicitly need additional trusted audiences.

## 2) Backend Endpoint

Apple mobile login endpoint:

- `POST /auth/apple/mobile`

Request body:

```json
{
  "identityToken": "<apple_identity_token>",
  "user": "<apple_user_identifier>",
  "email": "optional@apple.com",
  "firstName": "Optional",
  "lastName": "Optional"
}
```

Response:

```json
{
  "message": "Apple login successful",
  "token": "<access_token>",
  "refreshToken": "<refresh_token>",
  "user": {
    "id": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "..."
  },
  "provider": "apple"
}
```

## 3) Expo / iOS App Config

`stage2025/app.json` includes:

- `expo.ios.usesAppleSignIn: true`

Apple login is exposed on iOS in Login screen using `expo-apple-authentication`.

## 4) Apple Developer Console Checklist

1. In Apple Developer account, enable **Sign In with Apple** capability for app ID.
2. Ensure bundle ID is exactly `com.JuniorsCV.app` (or your final iOS bundle ID).
3. In App Store Connect, set Sign In with Apple for the app.
4. If you also use web flow later, configure Service ID + redirect domains.

## 5) Testing on iOS

1. Build/run on a real iOS device or simulator with Apple account signed in.
2. Open login screen and tap Apple icon.
3. Verify backend receives `/auth/apple/mobile` and returns tokens.
4. Confirm user session is created and app navigates to Home.

## 6) Notes

- Apple may provide email/fullName only on first user consent.
- Code stores Apple subject (`sub`) in `socialAuth.appleId` for account linking.
- Existing account linking by email is supported.
