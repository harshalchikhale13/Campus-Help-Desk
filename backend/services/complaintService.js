/**
 * Complaint Service - JSON Storage Version
 * Business logic for complaint operations
 */
const db = require('../config/database');
const { generateComplaintId } = require('../utils/idGenerator');

/**
 * Create new complaint
 */
const createComplaint = async (complaintData, userId) => {
  const {
    category = 'other',
    description = '',
    imageUrl = '',
    studentId = '',
    department = '',
    buildingName = '',
    roomNumber = '',
    issueLocation = '',
    priority = 'medium',
  } = complaintData;

  const complaintId = generateComplaintId();

  const complaint = db.insert('complaints.json', {
    complaint_id: complaintId,
    user_id: userId,
    student_id: studentId,
    department,
    category,
    description,
    image_url: imageUrl,
    building_name: buildingName,
    room_number: roomNumber,
    issue_location: issueLocation,
    status: 'submitted',
    priority,
    assigned_department_id: null,
    assigned_officer_id: null,
    resolution_description: null,
    estimated_resolution_date: null,
    actual_resolution_date: null,
    closed_at: null,
  });

  return complaint;
};

/**
 * Get complaint by ID
 */
const getComplaintById = async (complaintId) => {
  let complaint = null;

  // Try numeric ID first
  const numericId = parseInt(complaintId);
  if (!isNaN(numericId)) {
    complaint = db.findById('complaints.json', numericId);
  }

  // Try string ID (complaint_id format like "CMP-20260118-001")
  if (!complaint) {
    complaint = db.findOne('complaints.json', { complaint_id: complaintId });
  }

  if (!complaint) {
    throw new Error('Complaint not found');
  }

  const user = db.findById('users.json', complaint.user_id);
  const department = complaint.assigned_department_id
    ? db.findById('departments.json', complaint.assigned_department_id)
    : null;

  return {
    ...complaint,
    user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
    user_email: user ? user.email : '',
    department_name: department ? department.name : null,
  };
};

/**
 * Get all complaints with filtering
 */
const getAllComplaints = async (filters = {}, limit = 20, offset = 0) => {
  let complaints = db.getAll('complaints.json');

  // Apply filters
  if (filters.status) {
    complaints = complaints.filter((c) => c.status === filters.status);
  }

  if (filters.category) {
    complaints = complaints.filter((c) => c.category === filters.category);
  }

  if (filters.departmentId) {
    complaints = complaints.filter((c) => c.assigned_department_id === parseInt(filters.departmentId));
  }

  if (filters.userId) {
    complaints = complaints.filter((c) => c.user_id === parseInt(filters.userId));
  }

  if (filters.priority) {
    complaints = complaints.filter((c) => c.priority === filters.priority);
  }

  // Sort by created_at descending
  complaints = complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = complaints.length;
  const paginatedComplaints = complaints.slice(offset, offset + limit);

  return {
    complaints: paginatedComplaints,
    total,
    limit,
    offset,
  };
};

/**
 * Update complaint status
 */
const updateComplaintStatus = async (complaintId, newStatus, resolutionDescription = null) => {
  let complaint = db.findById('complaints.json', parseInt(complaintId));

  if (!complaint) {
    complaint = db.findOne('complaints.json', { complaint_id: complaintId });
  }

  if (!complaint) {
    throw new Error('Complaint not found');
  }

  const updateData = { status: newStatus };

  if (newStatus === 'resolved') {
    updateData.actual_resolution_date = new Date().toISOString();
    updateData.resolution_description = resolutionDescription;
  }

  if (newStatus === 'closed') {
    updateData.closed_at = new Date().toISOString();
  }

  const updated = db.updateById('complaints.json', complaint.id, updateData);
  return updated;
};

/**
 * Add complaint update
 */
const addComplaintUpdate = async (complaintId, updatedBy, statusChange, comment) => {
  let complaint = db.findById('complaints.json', parseInt(complaintId));

  if (!complaint) {
    complaint = db.findOne('complaints.json', { complaint_id: complaintId });
  }

  if (!complaint) {
    throw new Error('Complaint not found');
  }

  const update = db.insert('complaint_updates.json', {
    complaint_id: complaint.id,
    updated_by: updatedBy,
    status_change: statusChange,
    comment,
  });

  return update;
};

/**
 * Get complaint history
 */
const getComplaintHistory = async (complaintId) => {
  let complaint = db.findById('complaints.json', parseInt(complaintId));

  if (!complaint) {
    complaint = db.findOne('complaints.json', { complaint_id: complaintId });
  }

  if (!complaint) {
    throw new Error('Complaint not found');
  }

  const updates = db.find('complaint_updates.json', { complaint_id: complaint.id });

  const enrichedUpdates = updates.map((update) => {
    const user = db.findById('users.json', update.updated_by);
    return {
      ...update,
      updated_by_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      updated_by_email: user ? user.email : '',
    };
  });

  return enrichedUpdates.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

/**
 * Get complaint statistics
 */
const getComplaintStats = async () => {
  const complaints = db.getAll('complaints.json');

  const stats = {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === 'submitted').length,
    assigned: complaints.filter((c) => c.status === 'assigned').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    closed: complaints.filter((c) => c.status === 'closed').length,
    byCategory: {},
    byPriority: {},
  };

  // Count by category
  complaints.forEach((c) => {
    stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
  });

  // Count by priority
  complaints.forEach((c) => {
    stats.byPriority[c.priority] = (stats.byPriority[c.priority] || 0) + 1;
  });

  return stats;
};

/**
 * Delete complaint (Admin only)
 */
const deleteComplaint = async (complaintId) => {
  const complaint = db.findById('complaints.json', parseInt(complaintId));

  if (!complaint) {
    return null;
  }

  // Also delete associated updates
  const updates = db.getAll('complaint_updates.json');
  const filteredUpdates = updates.filter((u) => u.complaint_id !== parseInt(complaintId));
  db.write('complaint_updates.json', filteredUpdates);

  // Delete the complaint
  const deleted = db.deleteById('complaints.json', parseInt(complaintId));

  return deleted ? complaint : null;
};

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
