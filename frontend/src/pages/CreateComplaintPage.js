/**
 * CreateComplaintPage Component
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { toast } from 'react-toastify';
import '../styles/CreateComplaint.css';

export default function CreateComplaintPage() {
  const [formData, setFormData] = useState({
    category: 'classroom_issues',
    description: '',
    priority: 'medium',
    studentId: '',
    department: '',
    buildingName: '',
    roomNumber: '',
    issueLocation: 'Classroom',
    imageUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.category || !formData.description || !formData.issueLocation || !formData.studentId) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      const dataToSubmit = {
        category: formData.category === 'other' ? formData.customCategory : formData.category,
        description: formData.description,
        priority: formData.priority,
        studentId: formData.studentId,
        department: formData.department,
        buildingName: formData.buildingName,
        roomNumber: formData.roomNumber,
        issueLocation: formData.issueLocation,
        imageUrl: formData.imageUrl || null
      };

      const response = await complaintAPI.createComplaint(dataToSubmit);
      toast.success('Issue reported successfully!');
      navigate(`/complaint/${response.data.data.complaint_id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit issue';
      toast.error(message);
      console.error('Error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-complaint-container">
      <div className="create-complaint-card">
        <h1>🎓 Report Campus Issue</h1>

        <form onSubmit={handleSubmit} className="complaint-form">

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">Student ID <span className="required">*</span></label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="e.g. STU-2024-001"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">
              Issue Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="hostel_issues">Hostel Issues</option>
              <option value="classroom_issues">Classroom Issues</option>
              <option value="laboratory_issues">Laboratory Issues</option>
              <option value="it_support">IT Support</option>
              <option value="library_issues">Library Issues</option>
              <option value="campus_infrastructure">Campus Infrastructure</option>
              <option value="campus_safety">Campus Safety & Security</option>
              <option value="other">Other</option>
            </select>

            {formData.category === 'other' && (
              <input
                type="text"
                name="customCategory"
                value={formData.customCategory || ''}
                onChange={handleInputChange}
                placeholder="Please specify the category"
                className="mt-2"
                style={{ marginTop: '10px' }}
                required
              />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="issueLocation">Location Type <span className="required">*</span></label>
              <select
                id="issueLocation"
                name="issueLocation"
                value={formData.issueLocation}
                onChange={handleInputChange}
                required
              >
                <option value="Classroom">Classroom</option>
                <option value="Hostel">Hostel</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Library">Library</option>
                <option value="Common Area">Common Area</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="buildingName">Building Name</label>
              <input
                type="text"
                id="buildingName"
                name="buildingName"
                value={formData.buildingName}
                onChange={handleInputChange}
                placeholder="e.g. Academic Block A"
              />
            </div>

            <div className="form-group">
              <label htmlFor="roomNumber">Room Number</label>
              <input
                type="text"
                id="roomNumber"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                placeholder="e.g. 101"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Issue Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the issue in detail..."
              rows="5"
              required
            ></textarea>
            <small>{formData.description.length}/1000 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">Upload Image (Optional)</label>
            <div className="file-upload">
              <input
                type="file"
                id="image"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                hidden
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current.click()}
              >
                📸 Choose Image
              </button>
              {previewImage && (
                <div className="image-preview">
                  <img src={previewImage} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => {
                      setPreviewImage(null);
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      </div>
    </div>
  );
}
