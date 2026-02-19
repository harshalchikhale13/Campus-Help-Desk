/**
 * Complaint Controller
 * Handles complaint-related HTTP requests
 */
const complaintService = require('../services/complaintService');
const notificationService = require('../services/notificationService');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * Create complaint
 */
const createComplaint = asyncHandler(async (req, res) => {
  const {
    category,
    description,
    imageUrl,
    studentId,
    department,
    buildingName,
    roomNumber,
    issueLocation,
    priority
  } = req.body;



  const complaint = await complaintService.createComplaint(
    {
      category,
      description,
      imageUrl,
      studentId,
      department,
      buildingName,
      roomNumber,
      issueLocation,
      priority
    },
    req.user.id
  );

  // Send notification
  await notificationService.notifyComplaintSubmission(req.user.id, complaint);

  res.status(201).json({
    success: true,
    message: 'Complaint created successfully',
    data: complaint,
  });
});

/**
 * Get complaint by ID
 */
const getComplaintById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const complaint = await complaintService.getComplaintById(id);

  res.json({
    success: true,
    data: {
      complaint: complaint,
    },
  });
});

/**
 * Get all complaints with filters
 */
const getAllComplaints = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    departmentId,
    userId,
    priority,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  } = req.query;

  const filters = {
    status,
    category,
    departmentId: departmentId ? parseInt(departmentId) : null,
    userId: userId ? parseInt(userId) : null,
    priority,
    startDate,
    endDate,
  };

  const result = await complaintService.getAllComplaints(
    filters,
    parseInt(limit),
    parseInt(offset)
  );

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Update complaint status
 */
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolutionDescription, assignedDepartmentId, assignedOfficerId, estimatedResolutionDate } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const complaint = await complaintService.updateComplaintStatus(id, status, {
    resolutionDescription,
    assignedDepartmentId,
    assignedOfficerId,
    estimatedResolutionDate,
  });

  // Send notification
  const complaintData = await complaintService.getComplaintById(id);
  await notificationService.notifyComplaintUpdate(complaintData.user_id, complaintData, status);

  res.json({
    success: true,
    message: 'Complaint status updated successfully',
    data: complaint,
  });
});

/**
 * Add complaint update/comment
 */
const addComplaintUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statusChange, comment } = req.body;

  const update = await complaintService.addComplaintUpdate(id, req.user.id, {
    statusChange,
    comment,
  });

  res.status(201).json({
    success: true,
    message: 'Update added successfully',
    data: update,
  });
});

/**
 * Get complaint history
 */
const getComplaintHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const history = await complaintService.getComplaintHistory(id);

  res.json({
    success: true,
    data: history,
  });
});

/**
 * Get complaint statistics
 */
const getComplaintStats = asyncHandler(async (req, res) => {
  const stats = await complaintService.getComplaintStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Delete complaint (Admin only)
 */
const deleteComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await complaintService.deleteComplaint(id);

  if (!result) {
    throw new ApiError(404, 'Complaint not found');
  }

  res.json({
    success: true,
    message: 'Complaint deleted successfully',
    data: result,
  });
});

module.exports = {
  createComplaint,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  addComplaintUpdate,
  getComplaintHistory,
  getComplaintStats,
  deleteComplaint,
};
