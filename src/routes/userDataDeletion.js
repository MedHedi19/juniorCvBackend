const express = require('express');
const router = express.Router();
const { handleFacebookDataDeletion } = require('../controllers/userDataDeletionController');

// Facebook Data Deletion Callback
router.post('/data-deletion', handleFacebookDataDeletion);

// Facebook Data Deletion URL verification endpoint
router.get('/data-deletion', (req, res) => {
  // Return a confirmation code for Facebook verification
  res.status(200).json({
    confirmation_code: 'URL_VERIFICATION_SUCCESSFUL',
    message: 'This endpoint is properly configured for Facebook data deletion requests'
  });
});

module.exports = router;
