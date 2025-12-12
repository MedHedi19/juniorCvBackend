const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // Create a direct SMTP transport
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: (process.env.EMAIL_PORT || '587') === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetPin, firstName) => {
  try {
    const transporter = createTransporter();
    
    // Email content
    const mailOptions = {
      from: `"JuniorsCV Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Code de réinitialisation - JuniorsCV',
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
              <h1>JuniorsCV</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${firstName},</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte JuniorsCV.</p>
              
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
              <p>© 2025 JuniorsCV. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bonjour ${firstName},
        
        Vous avez demandé la réinitialisation de votre mot de passe pour votre compte JuniorsCV.
        
        VOTRE CODE DE RÉINITIALISATION : ${resetPin}
        
        Entrez ce code dans l'application mobile pour réinitialiser votre mot de passe.
        
        Ce code expire dans 1 heure.
        
        Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
        
        Important : Ne partagez jamais ce code avec quelqu'un d'autre.
        
        © 2025 JuniorsCV. Tous droits réservés.
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  try {
    // Validate inputs
    if (!email) {
      return { success: false, error: 'Missing recipient email address' };
    }
    
    if (!firstName) {
      firstName = 'User';
    }
    
    // Create email transport
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"JuniorsCV Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur JuniorsCV !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; }
            .header { background-color: #003B73; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .logo { width: 120px; height: auto; margin-bottom: 15px; }
            .content { padding: 35px 25px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
            .welcome-message { font-size: 18px; margin-bottom: 25px; color: #003B73; }
            .features { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #eaeaea; }
            .features h3 { color: #003B73; margin-top: 0; }
            .features ul { padding-left: 20px; }
            .features li { margin-bottom: 10px; }
            .button { display: inline-block; background-color: #003B73; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #f0f0f0; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
            .social { margin: 15px 0; }
            .social a { margin: 0 10px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur JuniorsCV !</h1>
            </div>
            <div class="content">
              <p class="welcome-message">Bonjour ${firstName},</p>
              <p>Nous sommes ravis de vous accueillir dans la communauté JuniorsCV ! Votre compte a été créé avec succès.</p>
              
              <div class="features">
                <h3>🚀 Avec JuniorsCV, vous pouvez maintenant :</h3>
                <ul>
                  <li><strong>Créer votre CV professionnel</strong> - Des modèles modernes adaptés à votre secteur d'activité</li>
                  <li><strong>Générer des lettres de motivation personnalisées</strong> - Impressionnez les recruteurs</li>
                  <li><strong>Passer des tests de personnalité</strong> - Découvrez vos forces et vos talents</li>
                  <li><strong>Accéder à des conseils de coaching</strong> - Préparez-vous pour vos entretiens</li>
                </ul>
              </div>
              
              <p>Notre mission est de vous aider à décrocher le job de vos rêves et à développer votre carrière professionnelle.</p>
              
              <p>Pour commencer, connectez-vous à votre compte et explorez toutes les fonctionnalités disponibles :</p>
              
              <div style="text-align: center;">
                <a href="https://juniorcv.com/login" class="button">Commencer maintenant</a>
              </div>
            </div>
            <div class="footer">
              <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:support@juniorcv.com">support@juniorcv.com</a></p>
              <div class="social">
                <a href="https://facebook.com/juniorcv">Facebook</a> | 
                <a href="https://linkedin.com/company/juniorcv">LinkedIn</a> | 
                <a href="https://instagram.com/juniorcv">Instagram</a>
              </div>
              <p>© 2025 JuniorsCV. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      code: error.code 
    };
  }
};

// Send social login welcome email
const sendSocialWelcomeEmail = async (email, firstName, provider) => {
  try {
    const transporter = createTransporter();
    
    // Get provider information
    const providerInfo = {
      google: {
        name: 'Google',
        color: '#DB4437',
        icon: '🔍'
      },
      facebook: {
        name: 'Facebook',
        color: '#4267B2',
        icon: '👥'
      },
      linkedin: {
        name: 'LinkedIn',
        color: '#0077B5',
        icon: '💼'
      }
    };
    
    const { name: providerName, icon } = providerInfo[provider] || { name: 'Social Media', icon: '🌐' };
    
    const mailOptions = {
      from: `"JuniorsCV Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur JuniorsCV !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; }
            .header { background-color: #003B73; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .logo { width: 120px; height: auto; margin-bottom: 15px; }
            .content { padding: 35px 25px; background-color: #f9f9f9; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
            .welcome-message { font-size: 18px; margin-bottom: 25px; color: #003B73; }
            .social-login-info { 
              background-color: #e8f4fc; 
              border-left: 4px solid #003B73; 
              padding: 15px; 
              margin-bottom: 25px;
              border-radius: 4px;
            }
            .features { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #eaeaea; }
            .features h3 { color: #003B73; margin-top: 0; }
            .features ul { padding-left: 20px; }
            .features li { margin-bottom: 10px; }
            .button { display: inline-block; background-color: #003B73; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #f0f0f0; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
            .social { margin: 15px 0; }
            .social a { margin: 0 10px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur JuniorsCV !</h1>
            </div>
            <div class="content">
              <p class="welcome-message">Bonjour ${firstName},</p>
              
              <div class="social-login-info">
                <p><strong>${icon} Vous vous êtes connecté(e) avec ${providerName}</strong></p>
                <p>Merci d'avoir choisi JuniorsCV ! Votre compte a été créé avec succès en utilisant votre compte ${providerName}.</p>
              </div>
              
              <p>Nous sommes ravis de vous accueillir dans la communauté JuniorsCV !</p>
              
              <div class="features">
                <h3>🚀 Avec JuniorsCV, vous pouvez maintenant :</h3>
                <ul>
                  <li><strong>Créer votre CV professionnel</strong> - Des modèles modernes adaptés à votre secteur d'activité</li>
                  <li><strong>Générer des lettres de motivation personnalisées</strong> - Impressionnez les recruteurs</li>
                  <li><strong>Passer des tests de personnalité</strong> - Découvrez vos forces et vos talents</li>
                  <li><strong>Accéder à des conseils de coaching</strong> - Préparez-vous pour vos entretiens</li>
                  <li><strong>Trouver des offres d'emploi</strong> - Adaptées à votre profil et vos compétences</li>
                </ul>
              </div>
              
              <p>Notre mission est de vous aider à décrocher le job de vos rêves et à développer votre carrière professionnelle.</p>
              
              <p>Pour commencer, explorez toutes les fonctionnalités disponibles :</p>
              
              <div style="text-align: center;">
                <a href="https://juniorcv.com/login" class="button">Commencer maintenant</a>
              </div>
            </div>
            <div class="footer">
              <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:support@juniorcv.com">support@juniorcv.com</a></p>
              <div class="social">
                <a href="https://facebook.com/juniorcv">Facebook</a> | 
                <a href="https://linkedin.com/company/juniorcv">LinkedIn</a> | 
                <a href="https://instagram.com/juniorcv">Instagram</a>
              </div>
              <p>© 2025 JuniorsCV. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send a certificate email with PDF attachment
  const sendCertificateEmail= async (email, firstName, pdfBuffer) => {
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"JuniorsCV Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Votre certificat JuniorsCV',
        html: `
          <p>Bonjour ${firstName},</p>
          <p>Félicitations pour avoir complété le parcours 7P. Veuillez trouver votre certificat en pièce jointe.</p>
          <p>Cordialement,<br/>L'équipe JuniorsCV</p>
        `,
        attachments: [
          {
            filename: 'JuniorsCV-Certificate.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending certificate email:', error);
      return { success: false, error: error.message };
    }
  }
  const sendCertificateEmail_21= async (email, firstName, pdfBuffer) => {
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"JuniorsCV Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Votre certificat JuniorsCV',
        html: `
          <p>Bonjour ${firstName},</p>
          <p>Félicitations pour avoir complété le "21 day challenge". Veuillez trouver votre certificat en pièce jointe.</p>
          <p>Cordialement,<br/>L'équipe JuniorsCV</p>
        `,
        attachments: [
          {
            filename: 'JuniorsCV-Certificate.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending certificate email:', error);
      return { success: false, error: error.message };
    }
  }

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSocialWelcomeEmail,
  sendCertificateEmail,
  sendCertificateEmail_21
};
