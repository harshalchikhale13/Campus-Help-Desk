/**
 * Complaint Routes
 */
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticateToken } = require('../middleware/auth');
const { authorize, isAdminOrOfficer } = require('../middleware/authorization');
const { validateComplaint, handleValidationErrors } = require('../utils/validators');

/**
 * Public Routes (requiring authentication)
 */

// Create complaint (Citizens, Staff, and Admins)
router.post(
  '/',
  authenticateToken,
  authorize('citizen', 'staff', 'admin', 'department_officer'),
  validateComplaint(),
  handleValidationErrors,
  complaintController.createComplaint
);

// Get complaint by ID
router.get(
  '/:id',
  authenticateToken,
  complaintController.getComplaintById
);

// Get complaint history
router.get(
  '/:id/history',
  authenticateToken,
  complaintController.getComplaintHistory
);

/**
 * Admin & Department Officer Routes
 */

// Get all complaints with filters
router.get(
  '/',
  authenticateToken,
  complaintController.getAllComplaints
);

// Update complaint status
router.put(
  '/:id/status',
  authenticateToken,
  isAdminOrOfficer,
  complaintController.updateComplaintStatus
);

// Delete complaint (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorize('admin'),
  complaintController.deleteComplaint
);

// Add complaint update/comment
router.post(
  '/:id/updates',
  authenticateToken,
  isAdminOrOfficer,
  complaintController.addComplaintUpdate
);

/**
 * Dashboard Routes
 */

// Get complaint statistics
router.get(
  '/stats/overview',
  authenticateToken,
  isAdminOrOfficer,
  complaintController.getComplaintStats
);

module.exports = router;
