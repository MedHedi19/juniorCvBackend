const User = require('../models/user');
const JobApplication = require('../models/jobApplication');
const PersonalityTest = require('../models/personalityTest');
const UpskillingProgress = require('../models/upskillingProgress');
const UserProgress = require('../models/userProgress');
const VarkTest = require('../models/varkTest');
const { sendAccountDeletionEmail } = require('../utils/emailService');
const crypto = require('crypto');
const path = require('path');

/**
 * Serve the public account deletion request page
 * This page is accessible without authentication (required by Google Play)
 */
const serveAccountDeletionPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/account-deletion.html'));
};

/**
 * Handle account deletion request (public endpoint)
 * Sends a confirmation email with a secure token
 */
const requestAccountDeletion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email requise',
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Return error if user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé avec cet email',
      });
    }

    // Generate secure deletion token
    const deletionToken = crypto.randomBytes(32).toString('hex');
    const deletionTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Save token to user
    user.deletionToken = deletionToken;
    user.deletionTokenExpires = deletionTokenExpires;
    await user.save();

    // Generate confirmation URL
    const baseUrl = process.env.BASE_URL || 'https://juniorcvbackend-mxog.onrender.com';
    const confirmationUrl = `${baseUrl}/account-deletion/confirm?token=${deletionToken}`;

    // Send confirmation email
    try {
      await sendAccountDeletionEmail(user.email, user.firstName || 'Utilisateur', confirmationUrl);
      console.log(`✅ Account deletion email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send deletion email to ${user.email}:`, emailError.message);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de l'email. Veuillez réessayer.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        'Un email de confirmation a été envoyé à ' +
        normalizedEmail +
        '. Vérifiez votre boîte de réception et vos spams.',
    });
  } catch (error) {
    console.error('Error in requestAccountDeletion:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
    });
  }
};

/**
 * Confirm and execute account deletion
 * Called when user clicks the link in the confirmation email
 */
const confirmAccountDeletion = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .send(
          generateResultPage(
            'error',
            'Lien invalide',
            'Le lien de suppression est invalide ou a expiré.'
          )
        );
    }

    // Find user with valid deletion token
    const user = await User.findOne({
      deletionToken: token,
      deletionTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .send(
          generateResultPage(
            'error',
            'Lien expiré',
            'Ce lien de suppression est invalide ou a expiré. Veuillez faire une nouvelle demande.'
          )
        );
    }

    const userId = user._id;
    const userEmail = user.email;
    const userName = user.firstName || 'Utilisateur';

    // Delete all user-related data
    await Promise.all([
      // Delete job applications
      JobApplication.deleteMany({ userId }),
      // Delete personality test results
      PersonalityTest.deleteOne({ userId }),
      // Delete upskilling progress
      UpskillingProgress.deleteOne({ userId }),
      // Delete user progress (quizzes)
      UserProgress.deleteOne({ userId }),
      // Delete VARK test results
      VarkTest.deleteOne({ userId }),
      // Delete the user account
      User.findByIdAndDelete(userId),
    ]);

    console.log(`✅ Account deleted successfully: ${userEmail}`);

    res
      .status(200)
      .send(
        generateResultPage(
          'success',
          'Compte supprimé',
          `Votre compte (${userEmail}) et toutes les données associées ont été supprimés avec succès.`
        )
      );
  } catch (error) {
    console.error('Error in confirmAccountDeletion:', error);
    res
      .status(500)
      .send(
        generateResultPage(
          'error',
          'Erreur',
          'Une erreur est survenue lors de la suppression. Veuillez réessayer ou contacter le support.'
        )
      );
  }
};

/**
 * Generate HTML result page
 */
function generateResultPage(type, title, message) {
  const isSuccess = type === 'success';
  const icon = isSuccess ? '✅' : '❌';
  const color = isSuccess ? '#28a745' : '#dc3545';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Boostify Skills</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #003B73 0%, #0074D9 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                max-width: 450px;
                width: 100%;
                text-align: center;
                overflow: hidden;
            }
            .header {
                background: ${color};
                color: white;
                padding: 30px;
            }
            .icon {
                font-size: 50px;
                margin-bottom: 15px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 30px;
            }
            .content p {
                color: #666;
                line-height: 1.6;
                margin-bottom: 25px;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                background: #003B73;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: background 0.3s;
            }
            .btn:hover {
                background: #002a54;
            }
            .footer {
                padding: 20px;
                color: #666;
                font-size: 13px;
                border-top: 1px solid #eee;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">${icon}</div>
                <h1>${title}</h1>
            </div>
            <div class="content">
                <p>${message}</p>
                ${isSuccess ? '' : '<a href="/account-deletion" class="btn">Nouvelle demande</a>'}
            </div>
            <div class="footer">
                <p>© 2025 Boostify Skills. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = {
  serveAccountDeletionPage,
  requestAccountDeletion,
  confirmAccountDeletion,
};
