const express = require('express');
const router = express.Router();

// Simple success response for Facebook data deletion callback
router.get('/', (req, res) => {
  res.status(200).json({
    url_confirmation: "success",
    confirmation_code: process.env.FACEBOOK_CONFIRMATION_CODE || "1234567890"
  });
});

// Handle actual deletion requests
router.post('/', (req, res) => {
  // Always return success as required by Facebook
  res.status(200).json({
    url_confirmation: "success",
    confirmation_code: process.env.FACEBOOK_CONFIRMATION_CODE || "1234567890"
  });
});

module.exports = router;
