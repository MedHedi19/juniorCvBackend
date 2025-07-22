const express = require('express');
const {  updateProfile, changePassword } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.put('/updateProfile', authMiddleware, updateProfile);
router.post('/changePassword', authMiddleware, changePassword);

module.exports = router;