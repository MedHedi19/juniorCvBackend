const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For Gmail (you can change this to other providers)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your app password (not regular password)
    },
  });

  // Alternative configuration for other SMTP providers
  // return nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: false,
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS,
  //   },
  // });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetPin, firstName) => {
  try {
    const transporter = createTransporter();
    
    // Email content
    const mailOptions = {
      from: `"JuniorCV Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Code de réinitialisation - JuniorCV',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003B73; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .pin-box { 
              background-color: #fff; 
              border: 3px solid #39C16C; 
              border-radius: 10px; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0;
            }
            .pin { 
              font-size: 36px; 
              font-weight: bold; 
              color: #003B73; 
              letter-spacing: 8px;
              font-family: monospace;
            }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>JuniorCV</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${firstName},</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte JuniorCV.</p>
              
              <div class="pin-box">
                <h3 style="margin: 0 0 10px 0; color: #003B73;">Votre code de réinitialisation :</h3>
                <div class="pin">${resetPin}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                  Entrez ce code dans l'application mobile
                </p>
              </div>
              
              <p><strong>Ce code expire dans 1 heure.</strong></p>
              <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
              <p><strong>Important :</strong> Ne partagez jamais ce code avec quelqu'un d'autre.</p>
            </div>
            <div class="footer">
              <p>© 2025 JuniorCV. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bonjour ${firstName},
        
        Vous avez demandé la réinitialisation de votre mot de passe pour votre compte JuniorCV.
        
        VOTRE CODE DE RÉINITIALISATION : ${resetPin}
        
        Entrez ce code dans l'application mobile pour réinitialiser votre mot de passe.
        
        Ce code expire dans 1 heure.
        
        Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
        
        Important : Ne partagez jamais ce code avec quelqu'un d'autre.
        
        © 2025 JuniorCV. Tous droits réservés.
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    console.log('Reset PIN sent to', email, ':', resetPin);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"JuniorCV Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur JuniorCV !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003B73; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur JuniorCV !</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${firstName},</h2>
              <p>Félicitations ! Votre compte JuniorCV a été créé avec succès.</p>
              <p>Vous pouvez maintenant :</p>
              <ul>
                <li>Créer votre CV professionnel</li>
                <li>Générer des lettres de motivation</li>
                <li>Accéder à nos services de coaching</li>
                <li>Passer des tests de personnalité</li>
              </ul>
              <p>Nous sommes ravis de vous accompagner dans votre parcours professionnel !</p>
            </div>
            <div class="footer">
              <p>© 2025 JuniorCV. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
