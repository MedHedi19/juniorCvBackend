const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication

/**
 * @route   POST /api/challenges/initialize
 * @desc    Initialize challenges for user based on personality color
 * @access  Private
 * @body    { personalityColor: 'rouge' | 'jaune' | 'vert' | 'bleu' }
 */
router.post('/initialize', authMiddleware, challengeController.initializeChallenges);

/**
 * @route   GET /api/challenges
 * @desc    Get all challenges for user's personality color
 * @access  Private
 * @query   lang=fr|en|ar (optional, default: fr)
 */
router.get('/', authMiddleware, challengeController.getAllChallenges);

/**
 * @route   GET /api/challenges/progress
 * @desc    Get user's challenge progress summary
 * @access  Private
 */
router.get('/progress', authMiddleware, challengeController.getChallengeProgress);

/**
 * @route   GET /api/challenges/:day
 * @desc    Get a specific challenge by day (1-21)
 * @access  Private
 * @params  day - Day number (1-21)
 * @query   lang=fr|en|ar (optional, default: fr)
 */
router.get('/:day', authMiddleware, challengeController.getChallengeByDay);

/**
 * @route   POST /api/challenges/:day/complete
 * @desc    Mark a challenge as completed
 * @access  Private
 * @params  day - Day number (1-21)
 * @body    { notes: 'optional user notes' }
 */
router.post('/:day/complete', authMiddleware, challengeController.completeChallenge);

/**
 * @route   POST /api/challenges/:day/submit-text
 * @desc    Submit text content for a challenge
 * @access  Private
 * @params  day - Day number (1-21)
 * @body    { textContent: 'user text submission' }
 */
router.post('/:day/submit-text', authMiddleware, challengeController.submitText);

/**
 * @route   POST /api/challenges/:day/submit-media
 * @desc    Submit media (audio/video) URL for a challenge
 * @access  Private
 * @params  day - Day number (1-21)
 * @body    { mediaUrl: 'cloud storage URL', mediaType: 'mime type', submissionType: 'audio' | 'video' }
 */
router.post('/:day/submit-media', authMiddleware, challengeController.submitMedia);

/**
 * @route   GET /api/challenges/:day/submission
 * @desc    Get user's submission for a specific challenge
 * @access  Private
 * @params  day - Day number (1-21)
 */
router.get('/:day/submission', authMiddleware, challengeController.getSubmission);

module.exports = router;
