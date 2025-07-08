const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/getProfile', authMiddleware, getProfile);
router.put('/updateProfile', authMiddleware, updateProfile);
router.post('/changePassword', authMiddleware, changePassword);

module.exports = router;