const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /challenges/initialize
 * @desc    Initialize challenges for user based on personality color
 * @access  Private
 * @body    { personalityColor: 'rouge' | 'jaune' | 'vert' | 'bleu' }
 */
router.post('/initialize', challengeController.initializeChallenges);

/**
 * @route   GET /api/challenges
 * @desc    Get all challenges for user's personality color
 * @access  Private
 * @query   lang=fr|en|ar (optional, default: fr)
 */
router.get('/', challengeController.getAllChallenges);

/**
 * @route   GET /api/challenges/progress
 * @desc    Get user's challenge progress summary
 * @access  Private
 */
router.get('/progress', challengeController.getChallengeProgress);

/**
 * @route   GET /api/challenges/:day
 * @desc    Get a specific challenge by day (1-21)
 * @access  Private
 * @params  day - Day number (1-21)
 * @query   lang=fr|en|ar (optional, default: fr)
 */
router.get('/:day', challengeController.getChallengeByDay);

/**
 * @route   POST /api/challenges/:day/complete
 * @desc    Mark a challenge as completed
 * @access  Private
 * @params  day - Day number (1-21)
 * @body    { notes: 'optional user notes' }
 */
router.post('/:day/complete', challengeController.completeChallenge);

module.exports = router;
