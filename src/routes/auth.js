const express = require('express');
const { register, login } = require('../controllers/authController');
// const { GoogleAuth } = require('google-auth-library');
const router = express.Router();
// const client = new OAuth2Client(process.env.WEB_CLIENT_ID);
// const { body, validationResult } = require('express-validator');

// const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);


// Inscription Google
// router.post('/google-register', [
//   body('email').isEmail(),
//   body('idToken').notEmpty(),
//   body('firstName').notEmpty(),
//   body('lastName').notEmpty(),
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ success: false, message: errors.array() });
//   }

//   const { idToken, email, firstName, lastName, googleId, phone } = req.body;

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.WEB_CLIENT_ID,
//     });
//     const payload = ticket.getPayload();

//     if (payload.email !== email) {
//       return res.status(400).json({ success: false, message: 'Email mismatch' });
//     }

//     let user = await User.findOne({ $or: [{ email }, { googleId }] });

//     if (user) {
//       if (!user.googleId && googleId) {
//         user.googleId = googleId;
//         await user.save();
//       }
//       return res.status(200).json({ success: true, message: 'User exists', user });
//     }

//     user = new User({
//       email,
//       firstName: firstName || payload.given_name || 'Inconnu',
//       lastName: lastName || payload.family_name || 'Inconnu',
//       googleId,
//       phone: phone || '',
//     });

//     await user.save();
//     return res.status(201).json({ success: true, message: 'Inscription réussie', user });
//   } catch (error) {
//     console.error('Erreur Google:', error);
//     return res.status(400).json({ success: false, message: 'Échec inscription Google' });
//   }
// });
// router.post(
//   '/google-register',
//   [
//     body('email').isEmail(),
//     body('idToken').notEmpty(),
//     body('firstName').notEmpty(),
//     body('lastName').notEmpty(),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ success: false, message: errors.array() });
//     }
//     // ... reste de l'endpoint (vérification du token, création de l'utilisateur)
//   }
// );
// // Inscription classique
// router.post('/register', [
//   body('email').isEmail(),
//   body('password').isLength({ min: 6 }),
//   body('firstName').notEmpty(),
//   body('lastName').notEmpty(),
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ success: false, message: errors.array() });
//   }

//   const { email, firstName, lastName, phone, password } = req.body;

//   try {
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ success: false, message: 'Email exists' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     user = new User({ email, firstName, lastName, phone, password: hashedPassword });
//     await user.save();
//     return res.status(201).json({ success: true, message: 'Inscription réussie' });
//   } catch (error) {
//     console.error('Erreur inscription:', error);
//     return res.status(400).json({ success: false, message: 'Échec inscription' });
//   }
// });

module.exports = router;