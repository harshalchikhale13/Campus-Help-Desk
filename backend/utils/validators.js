/**
 * Input Validation Utility
 * Validates and sanitizes user inputs
 */
const { body, validationResult, query } = require('express-validator');

/**
 * Sanitize string input - prevents XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim();
};

/**
 * Validate registration inputs
 */
const validateRegister = () => [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name is required'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Invalid phone number'),
];

/**
 * Validate login inputs
 */
const validateLogin = () => [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validate complaint creation
 */
const validateComplaint = () => [
  body('category')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('studentId')
    .optional()
    .trim(),
  body('issueLocation')
    .optional()
    .trim(),
  body('department')
    .optional()
    .trim(),
  body('buildingName')
    .optional()
    .trim(),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  sanitizeInput,
  validateRegister,
  validateLogin,
  validateComplaint,
  handleValidationErrors,
};
