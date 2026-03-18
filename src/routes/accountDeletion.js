const express = require('express');
const router = express.Router();
const {
  serveAccountDeletionPage,
  requestAccountDeletion,
  confirmAccountDeletion,
} = require('../controllers/accountDeletionController');

// =====================================================
// PUBLIC ACCOUNT DELETION ROUTES (Google Play Compliance)
// These routes must be accessible WITHOUT authentication
// =====================================================

// Public page for requesting account deletion (accessible via browser)
// URL to declare in Google Play Console: https://yourdomain.com/request-account-deletion
router.get('/', serveAccountDeletionPage);

// API endpoint to handle deletion request (receives email, sends confirmation)
router.post('/request', requestAccountDeletion);

// Confirmation endpoint (user clicks link from email)
router.get('/confirm', confirmAccountDeletion);

module.exports = router;
