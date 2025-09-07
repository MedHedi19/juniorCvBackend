const { sendWelcomeEmail } = require('../../../src/utils/emailService');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service - Welcome Email', () => {
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    // Setup mock for nodemailer
    mockSendMail = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        messageId: 'test-message-id'
      });
    });

    mockTransporter = {
      sendMail: mockSendMail
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Mock environment variables
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_PORT = '587';
  });

  it('should send welcome email successfully', async () => {
    const email = 'user@example.com';
    const firstName = 'Test';

    const result = await sendWelcomeEmail(email, firstName);

    // Check result
    expect(result).toEqual({
      success: true,
      messageId: 'test-message-id'
    });

    // Check that nodemailer was called correctly
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    });

    // Check that sendMail was called with correct parameters
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailOptions = mockSendMail.mock.calls[0][0];
    
    expect(mailOptions.from).toBe('"JuniorsCV Support" <test@example.com>');
    expect(mailOptions.to).toBe(email);
    expect(mailOptions.subject).toBe('Bienvenue sur JuniorsCV !');
    expect(mailOptions.html).toContain(`Bonjour ${firstName}`);
    expect(mailOptions.html).toContain('Créer votre CV professionnel');
    expect(mailOptions.html).toContain('Générer des lettres de motivation');
    expect(mailOptions.html).toContain('Passer des tests de personnalité');
  });

  it('should handle email failure gracefully', async () => {
    // Mock email failure
    mockSendMail.mockImplementationOnce(() => {
      return Promise.reject(new Error('SMTP error'));
    });

    const email = 'user@example.com';
    const firstName = 'Test';

    const result = await sendWelcomeEmail(email, firstName);

    // Check result contains error info but doesn't throw
    expect(result).toEqual({
      success: false,
      error: 'SMTP error'
    });
  });

  it('should include all required HTML elements in email', async () => {
    const email = 'user@example.com';
    const firstName = 'Test';

    await sendWelcomeEmail(email, firstName);

    // Get the HTML content from the mock call
    const mailOptions = mockSendMail.mock.calls[0][0];
    const html = mailOptions.html;
    
    // Verify essential elements are present
    expect(html).toContain('<html>');
    expect(html).toContain('<head>');
    expect(html).toContain('<style>');
    expect(html).toContain('<body>');
    expect(html).toContain('<div class="container">');
    expect(html).toContain('<div class="header">');
    expect(html).toContain('<div class="content">');
    expect(html).toContain('<div class="footer">');
    expect(html).toContain('© 2025 JuniorsCV');
    
    // Verify personalization
    expect(html).toContain(`Bonjour ${firstName}`);
    
    // Verify key features are mentioned
    expect(html).toContain('Créer votre CV professionnel');
    expect(html).toContain('Générer des lettres de motivation');
    expect(html).toContain('Passer des tests de personnalité');
    expect(html).toContain('Accéder à des conseils de coaching');
    
    // Verify call to action button
    expect(html).toContain('Commencer maintenant');
  });
});
