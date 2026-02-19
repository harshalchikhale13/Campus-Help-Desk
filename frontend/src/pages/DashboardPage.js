/**
 * DashboardPage Component
 * Shows student's issues or all issues for admin/staff
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../services/api';
import { formatDate, getStatusColor, getStatusLabel, getPriorityColor } from '../utils/helpers';
import { toast } from 'react-toastify';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    limit: 10,
    offset: 0,
  });
  const [total, setTotal] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If admin, redirect to admin dashboard
    if (user?.role === 'admin' || user?.role === 'department_officer') {
      navigate('/admin');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    // Only fetch if not admin
    if (user?.role !== 'admin' && user?.role !== 'department_officer') {
      fetchComplaints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = { ...filters };

      // Fetch all complaints for all users
      const response = await complaintAPI.getAllComplaints(params);
      setComplaints(response.data.data.complaints);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error('Failed to fetch issues');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      offset: 0, // Reset pagination
    }));
  };

  const handleViewComplaint = (id) => {
    navigate(`/complaint/${id}`);
  };

  const formatCategory = (category) => {
    if (!category) return '';
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatLocation = (c) => {
    const parts = [];
    if (c.issue_location) parts.push(c.issue_location);
    if (c.building_name) parts.push(c.building_name);
    if (c.room_number) parts.push(c.room_number);
    return parts.join(' - ') || 'N/A';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          {user?.role === 'citizen' ? 'My Reported Issues' : 'All Campus Issues'}
        </h1>
        {user?.role === 'citizen' && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/complaint/create')}
          >
            + Report New Issue
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Categories</option>
          <option value="hostel_issues">Hostel Issues</option>
          <option value="classroom_issues">Classroom Issues</option>
          <option value="laboratory_issues">Laboratory Issues</option>
          <option value="it_support">IT Support</option>
          <option value="library_issues">Library Issues</option>
          <option value="campus_infrastructure">Campus Infrastructure</option>
          <option value="campus_safety">Campus Safety</option>
        </select>

        <select
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Complaints List */}
      <div className="complaints-list">
        {loading ? (
          <div className="loading">Loading issues...</div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <p>No issues found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reported On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td className="complaint-id">{complaint.complaint_id}</td>
                    <td>{formatCategory(complaint.category)}</td>
                    <td>{formatLocation(complaint)}</td>
                    <td className="description">
                      {complaint.description.substring(0, 40)}...
                    </td>
                    <td>
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(complaint.priority) }}
                      >
                        {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(complaint.status) }}
                      >
                        {getStatusLabel(complaint.status)}
                      </span>
                    </td>
                    <td>{formatDate(complaint.created_at)}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleViewComplaint(complaint.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {complaints.length > 0 && (
        <div className="pagination-info">
          <p>
            Showing {complaints.length} of {total} issues
          </p>
        </div>
      )}
    </div>
  );
}
