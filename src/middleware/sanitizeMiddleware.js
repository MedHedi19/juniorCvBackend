const xss = require('xss');

/**
 * Middleware to sanitize request body to prevent XSS attacks
 * Sanitizes all string values in the request body object
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    const sanitized = sanitizeObject(req.body);
    req.body = sanitized;
  }
  
  if (req.params) {
    const sanitized = sanitizeObject(req.params);
    req.params = sanitized;
  }
  
  if (req.query) {
    const sanitized = sanitizeObject(req.query);
    req.query = sanitized;
  }
  
  next();
};

/**
 * Recursively sanitizes all string values in an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Skip password fields from sanitization
        if (key === 'password' || key === 'newPassword' || key === 'confirmPassword') {
          result[key] = value;
        } else {
          // Sanitize string with xss library
          result[key] = xss(value.trim());
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        result[key] = sanitizeObject(value);
      } else {
        // For other types (numbers, booleans, etc.)
        result[key] = value;
      }
    }
  }
  
  return result;
};

module.exports = sanitizeInput;
