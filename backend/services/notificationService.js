/**
 * Notification Service — PostgreSQL Version
 * Handles sending notifications (in-app only, email optional)
 */
const nodemailer = require('nodemailer');
const db = require('../config/database');

// Create email transporter (optional)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Save notification to storage
 */
const saveNotification = async (userId, complaintId, type, title, message) => {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, complaint_id, type, title, message, is_read, email_sent)
       VALUES ($1, $2, $3, $4, $5, false, false)
       RETURNING *`,
      [userId, complaintId, type, title, message]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

/**
 * Send email notification (optional)
 */
const sendEmailNotification = async (email, subject, htmlContent) => {
  if (!transporter) {
    console.log('Email not configured, skipping email notification');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL || 'noreply@civiccomplaints.com',
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Notify complaint submission
 */
const notifyComplaintSubmission = async (userId, complaintData) => {
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) return;

    // Save in-app notification
    await saveNotification(
      userId,
      complaintData.id,
      'submission',
      'Complaint Submitted',
      `Your complaint (ID: ${complaintData.complaint_id}) has been successfully submitted.`
    );

    // Try to send email
    const emailHtml = `
      <h2>Complaint Submitted Successfully</h2>
      <p>Hello ${user.first_name},</p>
      <p>Your complaint has been submitted to our system.</p>
      <p><strong>Complaint ID:</strong> ${complaintData.complaint_id}</p>
      <p><strong>Category:</strong> ${complaintData.category}</p>
      <p><strong>Status:</strong> Submitted</p>
      <p>We will review your complaint and keep you updated on its status.</p>
    `;

    await sendEmailNotification(user.email, 'Your Complaint Has Been Submitted', emailHtml);
  } catch (error) {
    console.error('Error in notifyComplaintSubmission:', error);
  }
};

/**
 * Notify complaint assignment
 */
const notifyComplaintAssignment = async (userId, complaintData, departmentId) => {
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const deptResult = await db.query('SELECT * FROM departments WHERE id = $1', [departmentId]);
    const department = deptResult.rows[0];

    if (!user || !department) return;

    // Save in-app notification
    await saveNotification(
      userId,
      complaintData.id,
      'assignment',
      'Complaint Assigned',
      `Your complaint (ID: ${complaintData.complaint_id}) has been assigned to ${department.name}.`
    );

    // Try to send email
    const emailHtml = `
      <h2>Complaint Assigned to Department</h2>
      <p>Hello ${user.first_name},</p>
      <p>Your complaint has been assigned to a department for resolution.</p>
      <p><strong>Complaint ID:</strong> ${complaintData.complaint_id}</p>
      <p><strong>Assigned Department:</strong> ${department.name}</p>
      <p><strong>Status:</strong> Assigned</p>
      <p>The department will work on resolving your complaint.</p>
    `;

    await sendEmailNotification(user.email, 'Your Complaint Has Been Assigned', emailHtml);
  } catch (error) {
    console.error('Error in notifyComplaintAssignment:', error);
  }
};

/**
 * Notify complaint update
 */
const notifyComplaintUpdate = async (userId, complaintData, newStatus) => {
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) return;

    // Save in-app notification
    await saveNotification(
      userId,
      complaintData.id,
      'update',
      'Complaint Status Updated',
      `Your complaint (ID: ${complaintData.complaint_id}) status has been updated to: ${newStatus}`
    );

    // Try to send email
    const emailHtml = `
      <h2>Complaint Status Updated</h2>
      <p>Hello ${user.first_name},</p>
      <p>There's an update on your complaint.</p>
      <p><strong>Complaint ID:</strong> ${complaintData.complaint_id}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p>Thank you for bringing this matter to our attention.</p>
    `;

    await sendEmailNotification(user.email, 'Your Complaint Status Has Been Updated', emailHtml);
  } catch (error) {
    console.error('Error in notifyComplaintUpdate:', error);
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const countResult = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      notifications: result.rows,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (notificationId) => {
  try {
    const result = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

module.exports = {
  saveNotification,
  sendEmailNotification,
  notifyComplaintSubmission,
  notifyComplaintAssignment,
  notifyComplaintUpdate,
  getUserNotifications,
  markNotificationAsRead,
};
