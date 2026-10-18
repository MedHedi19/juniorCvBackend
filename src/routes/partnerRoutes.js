const express = require('express');
const router = express.Router();
const { getUsers, getUserById, getUserChallenges } = require('../controllers/partnerController');

/**
 * @route   GET /partner/users
 * @desc    List all users with summary (personality, challenges, VARK)
 * @access  Public (partner dashboard - no auth required for now)
 */
router.get('/users', getUsers);

/**
 * @route   GET /partner/users/:id
 * @desc    Get full user details + personality test result
 * @access  Public (partner dashboard)
 */
router.get('/users/:id', getUserById);

/**
 * @route   GET /partner/users/:id/challenges
 * @desc    Get user's 21-day challenge progress
 * @access  Public (partner dashboard)
 */
router.get('/users/:id/challenges', getUserChallenges);

module.exports = router;
