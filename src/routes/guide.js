const express = require('express');
const {
  getGuideStatus,
  getGuideProfile,
  updateGuideProfile,
  markGuideShown,
} = require('../controllers/guideController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /guide/status — fetch hasGuideShown + domaine/speciality indices
router.get('/status', authMiddleware, getGuideStatus);

// GET /guide/profile — fetch domaine and speciality indices
router.get('/profile', authMiddleware, getGuideProfile);

// PUT /guide/profile — set domaine and speciality indices
router.put('/profile', authMiddleware, updateGuideProfile);

// PATCH /guide/shown — mark guide as shown
router.patch('/shown', authMiddleware, markGuideShown);

module.exports = router;
