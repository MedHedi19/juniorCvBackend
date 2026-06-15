const express = require('express');
const { getGuideStatus, updateGuideProfile, markGuideShown } = require('../controllers/guideController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /guide/status — fetch hasGuideShown + domaine + speciality
router.get('/status', authMiddleware, getGuideStatus);

// PUT /guide/profile — set domaine and speciality
router.put('/profile', authMiddleware, updateGuideProfile);

// PATCH /guide/shown — mark guide as shown
router.patch('/shown', authMiddleware, markGuideShown);

module.exports = router;
