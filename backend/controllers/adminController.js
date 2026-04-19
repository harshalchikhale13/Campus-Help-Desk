/**
 * Admin Controller — PostgreSQL Version
 * Handles admin operations: officer management, bulk assignment, statistics, analytics
 */

const db = require('../config/database');
const advancedAI = require('../services/advancedAIService');

class AdminController {
  /**
   * Get overall system statistics
   */
  static async getSystemStats(req, res) {
    try {
      // Complaint counts by status
      const statusResult = await db.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'submitted') AS submitted,
          COUNT(*) FILTER (WHERE status = 'in-progress' OR status = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
          COUNT(*) FILTER (WHERE status = 'closed') AS closed
        FROM complaints
      `);
      const sc = statusResult.rows[0];

      // Priority counts
      const priorityResult = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE priority = 'low') AS low,
          COUNT(*) FILTER (WHERE priority = 'medium') AS medium,
          COUNT(*) FILTER (WHERE priority = 'high') AS high
        FROM complaints
      `);
      const pc = priorityResult.rows[0];

      // Category breakdown
      const catResult = await db.query(
        `SELECT category, COUNT(*) AS count FROM complaints GROUP BY category`
      );
      const complaintsByCategory = {};
      catResult.rows.forEach(r => { complaintsByCategory[r.category] = parseInt(r.count); });

      // Total users and departments
      const userCount = await db.query('SELECT COUNT(*) FROM users');
      const deptCount = await db.query('SELECT COUNT(*) FROM departments');

      // Assignment rate
      const assignedResult = await db.query(
        'SELECT COUNT(*) FROM complaints WHERE assigned_officer_id IS NOT NULL'
      );
      const totalComplaints = parseInt(sc.total);
      const assignedCount = parseInt(assignedResult.rows[0].count);
      const assignmentRate = totalComplaints > 0 ? Math.round((assignedCount / totalComplaints) * 100) : 0;

      // Average resolution time (in days)
      const resTimeResult = await db.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (actual_resolution_date - created_at)) / 86400) AS avg_days
        FROM complaints
        WHERE status = 'resolved' AND actual_resolution_date IS NOT NULL
      `);
      const averageResolutionTime = resTimeResult.rows[0].avg_days
        ? Math.round(parseFloat(resTimeResult.rows[0].avg_days))
        : 0;

      // Overdue count (submitted > 7 days ago)
      const overdueResult = await db.query(`
        SELECT COUNT(*) FROM complaints
        WHERE status = 'submitted' AND created_at < NOW() - INTERVAL '7 days'
      `);

      const stats = {
        totalComplaints,
        totalUsers: parseInt(userCount.rows[0].count),
        totalDepartments: parseInt(deptCount.rows[0].count),
        complaintsByStatus: {
          submitted: parseInt(sc.submitted),
          'in-progress': parseInt(sc.in_progress),
          resolved: parseInt(sc.resolved),
          closed: parseInt(sc.closed)
        },
        complaintsByPriority: {
          low: parseInt(pc.low),
          medium: parseInt(pc.medium),
          high: parseInt(pc.high)
        },
        complaintsByCategory,
        averageResolutionTime,
        pendingCount: parseInt(sc.submitted),
        overdueCount: parseInt(overdueResult.rows[0].count),
        assignmentRate
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new officer account
   */
  static async createOfficer(req, res) {
    try {
      const { firstName, lastName, email, password, department, phone } = req.body;

      // Use userService to register (reuse logic)
      const userService = require('../services/userService');

      const result = await userService.registerUser({
        firstName,
        lastName,
        email,
        password,
        phone,
        username: email.split('@')[0], // Generate username from email
        role: 'officer'
      });

      // Update with department if needed
      if (department) {
        await db.query(
          'UPDATE users SET department = $1 WHERE id = $2',
          [department, result.data.id]
        );
        result.data.department = department;
      }

      res.status(201).json({
        success: true,
        message: 'Officer created successfully',
        officer: result.data
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Assign a single complaint to an officer
   */
  static async assignComplaint(req, res) {
    try {
      const { complaintId } = req.params;
      const { officerId } = req.body;

      if (!officerId) {
        return res.status(400).json({ error: 'Officer ID is required' });
      }

      // Check if complaint exists
      const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
      if (complaintResult.rows.length === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      // Check if officer exists
      const officerResult = await db.query(
        "SELECT * FROM users WHERE id = $1 AND (role = 'officer' OR role = 'admin' OR role = 'staff')",
        [officerId]
      );
      if (officerResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid officer selected' });
      }

      const officer = officerResult.rows[0];

      // Update complaint
      const updateResult = await db.query(
        `UPDATE complaints
         SET assigned_officer_id = $1, status = 'in_progress'
         WHERE id = $2
         RETURNING *`,
        [officerId, complaintId]
      );

      res.json({
        success: true,
        message: 'Complaint assigned successfully',
        complaint: updateResult.rows[0]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get officer statistics and performance metrics
   */
  static async getOfficerStats(req, res) {
    try {
      const officersResult = await db.query(
        "SELECT * FROM users WHERE role IN ('officer', 'department_officer', 'staff')"
      );
      const officers = officersResult.rows;

      const officerStats = [];

      for (const officer of officers) {
        const statsResult = await db.query(`
          SELECT
            COUNT(*) AS total_assigned,
            COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
            COUNT(*) FILTER (WHERE status = 'submitted') AS pending,
            COUNT(*) FILTER (WHERE status = 'in-progress' OR status = 'in_progress') AS in_progress
          FROM complaints
          WHERE assigned_officer_id = $1
        `, [officer.id]);

        const s = statsResult.rows[0];

        // Average resolution time
        const avgResult = await db.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (actual_resolution_date - created_at)) / 86400) AS avg_days
          FROM complaints
          WHERE assigned_officer_id = $1 AND status = 'resolved' AND actual_resolution_date IS NOT NULL
        `, [officer.id]);

        const avgDays = avgResult.rows[0].avg_days ? Math.round(parseFloat(avgResult.rows[0].avg_days)) : 0;
        const totalAssigned = parseInt(s.total_assigned);
        const resolvedCount = parseInt(s.resolved);

        officerStats.push({
          id: officer.id,
          name: officer.first_name ? `${officer.first_name} ${officer.last_name}` : officer.email,
          email: officer.email,
          totalAssigned,
          resolved: resolvedCount,
          inProgress: parseInt(s.in_progress),
          pending: parseInt(s.pending),
          resolutionRate: totalAssigned > 0 ? Math.round((resolvedCount / totalAssigned) * 100) : 0,
          averageResolutionTime: avgDays,
          department: officer.department || 'General'
        });
      }

      res.json(officerStats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Bulk assign complaints to officers
   * POST body: { complaintIds: [], assignToOfficerId: "" }
   */
  static async bulkAssignComplaints(req, res) {
    try {
      const { complaintIds, assignToOfficerId } = req.body;

      if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
        return res.status(400).json({ error: 'No complaints selected' });
      }

      if (!assignToOfficerId) {
        return res.status(400).json({ error: 'No officer selected' });
      }

      const result = await db.query(
        `UPDATE complaints
         SET assigned_officer_id = $1, status = 'in_progress'
         WHERE id = ANY($2::int[])`,
        [assignToOfficerId, complaintIds]
      );

      res.json({
        success: true,
        message: `${result.rowCount} complaints assigned successfully`,
        updated: result.rowCount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get complaints with AI analysis for admin review
   */
  static async getComplaintsWithAIAnalysis(req, res) {
    try {
      const { limit = 20, offset = 0, status = null, category = null } = req.query;

      let conditions = [];
      let params = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }
      if (category) {
        conditions.push(`category = $${paramIndex++}`);
        params.push(category);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await db.query(`SELECT COUNT(*) FROM complaints ${whereClause}`, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated complaints
      const dataResult = await db.query(
        `SELECT * FROM complaints ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      // Get all complaints for similarity analysis
      const allComplaints = (await db.query('SELECT * FROM complaints')).rows;

      // Add AI analysis to each complaint
      const analyzed = dataResult.rows.map(complaint => {
        const analysis = advancedAI.analyzeComplaintComprehensive(complaint, allComplaints);
        return {
          ...complaint,
          aiAnalysis: analysis
        };
      });

      res.json({
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        complaints: analyzed
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get complaints grouped by category and status
   */
  static async getComplaintAnalytics(req, res) {
    try {
      // By category with status breakdown
      const catStatusResult = await db.query(`
        SELECT category, status, COUNT(*) AS count
        FROM complaints
        GROUP BY category, status
      `);

      const byCategory = {};
      catStatusResult.rows.forEach(r => {
        if (!byCategory[r.category]) {
          byCategory[r.category] = { total: 0, statuses: {} };
        }
        byCategory[r.category].total += parseInt(r.count);
        byCategory[r.category].statuses[r.status] = parseInt(r.count);
      });

      // By status
      const statusResult = await db.query(
        `SELECT status, COUNT(*) AS count FROM complaints GROUP BY status`
      );
      const byStatus = {};
      statusResult.rows.forEach(r => { byStatus[r.status] = parseInt(r.count); });

      // By priority
      const priResult = await db.query(
        `SELECT priority, COUNT(*) AS count FROM complaints GROUP BY priority`
      );
      const byPriority = {};
      priResult.rows.forEach(r => { byPriority[r.priority] = parseInt(r.count); });

      // By department
      const deptResult = await db.query(
        `SELECT COALESCE(department, 'Unassigned') AS dept, COUNT(*) AS count FROM complaints GROUP BY department`
      );
      const byDepartment = {};
      deptResult.rows.forEach(r => { byDepartment[r.dept] = parseInt(r.count); });

      // Timeline (last 30 days)
      const timelineResult = await db.query(`
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM complaints
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Fill in missing dates
      const timeline = [];
      const today = new Date();
      const timelineMap = {};
      timelineResult.rows.forEach(r => {
        timelineMap[r.date.toISOString().split('T')[0]] = parseInt(r.count);
      });

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        timeline.push({ date: dateStr, count: timelineMap[dateStr] || 0 });
      }

      res.json({
        byCategory,
        byStatus,
        byPriority,
        byDepartment,
        timeline
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Find and get duplicate/similar complaints
   */
  static async findDuplicateComplaints(req, res) {
    try {
      const { complaintId } = req.params;

      const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
      if (complaintResult.rows.length === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const complaint = complaintResult.rows[0];
      const allComplaints = (await db.query('SELECT * FROM complaints WHERE id != $1', [complaintId])).rows;

      const analysis = advancedAI.findSimilarComplaints(complaint, allComplaints);

      res.json({
        complaintId,
        category: complaint.category,
        ...analysis
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Merge duplicate complaints
   * POST body: { mainComplaintId: "", duplicateIds: [] }
   */
  static async mergeDuplicateComplaints(req, res) {
    try {
      const { mainComplaintId, duplicateIds } = req.body;

      if (!mainComplaintId || !duplicateIds || duplicateIds.length === 0) {
        return res.status(400).json({ error: 'Invalid merge parameters' });
      }

      const mainResult = await db.query('SELECT * FROM complaints WHERE id = $1', [mainComplaintId]);
      if (mainResult.rows.length === 0) {
        return res.status(404).json({ error: 'Main complaint not found' });
      }

      // Mark duplicates as closed with a note
      await db.query(
        `UPDATE complaints
         SET status = 'closed',
             resolution_description = COALESCE(resolution_description, '') || ' [Merged as duplicate of complaint ' || $1 || ']',
             closed_at = NOW()
         WHERE id = ANY($2::int[])`,
        [mainComplaintId, duplicateIds]
      );

      res.json({
        success: true,
        message: `${duplicateIds.length} complaints merged`,
        merged: duplicateIds.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get department performance metrics
   */
  static async getDepartmentMetrics(req, res) {
    try {
      const deptResult = await db.query('SELECT * FROM departments');
      const departments = deptResult.rows;

      const metrics = [];

      for (const dept of departments) {
        const statsResult = await db.query(`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
            COUNT(*) FILTER (WHERE status = 'submitted') AS pending
          FROM complaints
          WHERE department = $1
        `, [dept.name]);

        const s = statsResult.rows[0];
        const total = parseInt(s.total);
        const resolved = parseInt(s.resolved);

        // Average resolution time
        const avgResult = await db.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (actual_resolution_date - created_at)) / 86400) AS avg_days
          FROM complaints
          WHERE department = $1 AND status = 'resolved' AND actual_resolution_date IS NOT NULL
        `, [dept.name]);

        const avgDays = avgResult.rows[0].avg_days ? Math.round(parseFloat(avgResult.rows[0].avg_days)) : 0;

        metrics.push({
          name: dept.name,
          total,
          resolved,
          pending: parseInt(s.pending),
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
          avgResolutionDays: avgDays
        });
      }

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AdminController;
