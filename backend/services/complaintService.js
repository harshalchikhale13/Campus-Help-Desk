/**
 * Complaint Service — PostgreSQL Version
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

  const result = await db.query(
    `INSERT INTO complaints
       (complaint_id, user_id, student_id, department, category, description,
        image_url, building_name, room_number, issue_location, status, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'submitted', $11)
     RETURNING *`,
    [complaintId, userId, studentId, department, category, description,
     imageUrl, buildingName, roomNumber, issueLocation, priority]
  );

  return result.rows[0];
};

/**
 * Get complaint by ID
 */
const getComplaintById = async (complaintId) => {
  // Try numeric ID first, then string complaint_id
  const numericId = parseInt(complaintId);
  let result;

  if (!isNaN(numericId)) {
    result = await db.query(
      `SELECT c.*, 
              u.first_name || ' ' || u.last_name AS user_name,
              u.email AS user_email,
              d.name AS department_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN departments d ON c.assigned_department_id = d.id
       WHERE c.id = $1`,
      [numericId]
    );
  }

  if (!result || result.rows.length === 0) {
    result = await db.query(
      `SELECT c.*, 
              u.first_name || ' ' || u.last_name AS user_name,
              u.email AS user_email,
              d.name AS department_name
       FROM complaints c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN departments d ON c.assigned_department_id = d.id
       WHERE c.complaint_id = $1`,
      [complaintId]
    );
  }

  if (result.rows.length === 0) {
    throw new Error('Complaint not found');
  }

  return result.rows[0];
};

/**
 * Get all complaints with filtering
 */
const getAllComplaints = async (filters = {}, limit = 20, offset = 0) => {
  let conditions = [];
  let params = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`c.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.category) {
    conditions.push(`c.category = $${paramIndex++}`);
    params.push(filters.category);
  }

  if (filters.departmentId) {
    conditions.push(`c.assigned_department_id = $${paramIndex++}`);
    params.push(parseInt(filters.departmentId));
  }

  if (filters.userId) {
    conditions.push(`c.user_id = $${paramIndex++}`);
    params.push(parseInt(filters.userId));
  }

  if (filters.priority) {
    conditions.push(`c.priority = $${paramIndex++}`);
    params.push(filters.priority);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) FROM complaints c ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const dataResult = await db.query(
    `SELECT c.* FROM complaints c
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return {
    complaints: dataResult.rows,
    total,
    limit,
    offset,
  };
};

/**
 * Update complaint status
 */
const updateComplaintStatus = async (complaintId, newStatus, additionalData = {}) => {
  // Find the complaint first
  const numericId = parseInt(complaintId);
  let findResult;

  if (!isNaN(numericId)) {
    findResult = await db.query('SELECT id FROM complaints WHERE id = $1', [numericId]);
  }

  if (!findResult || findResult.rows.length === 0) {
    findResult = await db.query('SELECT id FROM complaints WHERE complaint_id = $1', [complaintId]);
  }

  if (findResult.rows.length === 0) {
    throw new Error('Complaint not found');
  }

  const dbId = findResult.rows[0].id;

  // Build dynamic UPDATE
  let setClauses = ['status = $1'];
  let params = [newStatus];
  let paramIndex = 2;

  if (newStatus === 'resolved') {
    setClauses.push(`actual_resolution_date = NOW()`);
    if (additionalData.resolutionDescription) {
      setClauses.push(`resolution_description = $${paramIndex++}`);
      params.push(additionalData.resolutionDescription);
    }
  }

  if (newStatus === 'closed') {
    setClauses.push(`closed_at = NOW()`);
  }

  if (additionalData.assignedDepartmentId) {
    setClauses.push(`assigned_department_id = $${paramIndex++}`);
    params.push(additionalData.assignedDepartmentId);
  }

  if (additionalData.assignedOfficerId) {
    setClauses.push(`assigned_officer_id = $${paramIndex++}`);
    params.push(additionalData.assignedOfficerId);
  }

  if (additionalData.estimatedResolutionDate) {
    setClauses.push(`estimated_resolution_date = $${paramIndex++}`);
    params.push(additionalData.estimatedResolutionDate);
  }

  params.push(dbId);

  const result = await db.query(
    `UPDATE complaints SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  return result.rows[0];
};

/**
 * Add complaint update
 */
const addComplaintUpdate = async (complaintId, updatedBy, updateData) => {
  // Find the complaint first
  const numericId = parseInt(complaintId);
  let findResult;

  if (!isNaN(numericId)) {
    findResult = await db.query('SELECT id FROM complaints WHERE id = $1', [numericId]);
  }

  if (!findResult || findResult.rows.length === 0) {
    findResult = await db.query('SELECT id FROM complaints WHERE complaint_id = $1', [complaintId]);
  }

  if (findResult.rows.length === 0) {
    throw new Error('Complaint not found');
  }

  const dbId = findResult.rows[0].id;

  const result = await db.query(
    `INSERT INTO complaint_updates (complaint_id, updated_by, status_change, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [dbId, updatedBy, updateData.statusChange, updateData.comment]
  );

  return result.rows[0];
};

/**
 * Get complaint history
 */
const getComplaintHistory = async (complaintId) => {
  // Find the complaint first
  const numericId = parseInt(complaintId);
  let findResult;

  if (!isNaN(numericId)) {
    findResult = await db.query('SELECT id FROM complaints WHERE id = $1', [numericId]);
  }

  if (!findResult || findResult.rows.length === 0) {
    findResult = await db.query('SELECT id FROM complaints WHERE complaint_id = $1', [complaintId]);
  }

  if (findResult.rows.length === 0) {
    throw new Error('Complaint not found');
  }

  const dbId = findResult.rows[0].id;

  const result = await db.query(
    `SELECT cu.*,
            u.first_name || ' ' || u.last_name AS updated_by_name,
            u.email AS updated_by_email
     FROM complaint_updates cu
     LEFT JOIN users u ON cu.updated_by = u.id
     WHERE cu.complaint_id = $1
     ORDER BY cu.created_at ASC`,
    [dbId]
  );

  return result.rows;
};

/**
 * Get complaint statistics
 */
const getComplaintStats = async () => {
  const result = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'submitted') AS submitted,
      COUNT(*) FILTER (WHERE status = 'assigned') AS assigned,
      COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
      COUNT(*) FILTER (WHERE status = 'closed') AS closed
    FROM complaints
  `);

  const counts = result.rows[0];

  // Category breakdown
  const catResult = await db.query(
    `SELECT category, COUNT(*) AS count FROM complaints GROUP BY category`
  );
  const byCategory = {};
  catResult.rows.forEach((r) => { byCategory[r.category] = parseInt(r.count); });

  // Priority breakdown
  const priResult = await db.query(
    `SELECT priority, COUNT(*) AS count FROM complaints GROUP BY priority`
  );
  const byPriority = {};
  priResult.rows.forEach((r) => { byPriority[r.priority] = parseInt(r.count); });

  return {
    total: parseInt(counts.total),
    submitted: parseInt(counts.submitted),
    assigned: parseInt(counts.assigned),
    inProgress: parseInt(counts.in_progress),
    resolved: parseInt(counts.resolved),
    closed: parseInt(counts.closed),
    byCategory,
    byPriority,
  };
};

/**
 * Delete complaint (Admin only)
 */
const deleteComplaint = async (complaintId) => {
  const findResult = await db.query('SELECT * FROM complaints WHERE id = $1', [parseInt(complaintId)]);
  const complaint = findResult.rows[0];

  if (!complaint) {
    return null;
  }

  // Delete associated updates (CASCADE should handle this, but be explicit)
  await db.query('DELETE FROM complaint_updates WHERE complaint_id = $1', [complaint.id]);

  // Delete the complaint
  await db.query('DELETE FROM complaints WHERE id = $1', [complaint.id]);

  return complaint;
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
