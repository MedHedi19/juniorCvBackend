const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { updateProfile, changePassword } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/user'); 

// Config multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profile'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// Route image → update dans user
router.post('/uploadProfileImage', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune image envoyée' });

    const imagePath = `/uploads/profile/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imagePath },
      { new: true }
    );

    res.json({
      message: 'Image de profil mise à jour',
      imageUrl: imagePath,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l’upload' });
  }
});

module.exports = router;
