# Email Service Setup Guide

## 📧 Current Status
The email service has been implemented using Nodemailer, but requires configuration to work properly.

## 🔧 Setup Instructions

### 1. Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Update .env file** with your credentials:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   FRONTEND_URL=http://localhost:8081
   ```

### 2. Alternative SMTP Providers
You can also use other email providers by updating the transporter configuration in `src/utils/emailService.js`:

#### Outlook/Hotmail
```javascript
service: 'hotmail'
```

#### Custom SMTP
```javascript
host: 'your-smtp-host.com',
port: 587,
secure: false,
```

## 🚀 Features Implemented

### Password Reset Flow:
1. User enters email on forgot password screen
2. Backend generates secure reset token
3. Email sent with reset link
4. User clicks link to reset password
5. Token validated and password updated

### Email Templates:
- **Password Reset Email**: Professional HTML template with reset button
- **Welcome Email**: Sent after successful registration (optional)

## 🔒 Security Features
- Reset tokens expire after 1 hour
- Tokens are cryptographically secure (32 random bytes)
- Email sending failures are handled gracefully
- Tokens are removed if email sending fails

## 🧪 Testing
In development mode, the app will show the reset token in an alert for testing purposes. This is automatically disabled in production.

## 📱 Frontend Integration
- New screens: `ForgotPasswordScreen` and `ResetPasswordScreen`
- Navigation properly integrated
- Redux actions for forgot/reset password
- Toast notifications for user feedback

## 🛠️ Troubleshooting

### Common Issues:
1. **"Invalid login"**: Check if 2FA is enabled and app password is correct
2. **"Connection refused"**: Check firewall/network settings
3. **Emails go to spam**: Configure SPF/DKIM records for your domain

### Development Testing:
- Check server console for email sending logs
- Use a test email service like Mailtrap for development
- Verify .env variables are loaded correctly

## 🚀 Production Deployment
1. Replace Gmail with a professional email service (SendGrid, Mailgun, AWS SES)
2. Set up proper domain and DNS records
3. Remove development-only features (token display)
4. Add email rate limiting
5. Implement email templates storage
6. Add email delivery tracking

## 📞 Support
If you need help setting up the email service, check the logs in the backend console for detailed error messages.
