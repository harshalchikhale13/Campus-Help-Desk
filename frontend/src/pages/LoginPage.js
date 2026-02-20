/**
 * LoginPage Component
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';
import '../styles/Auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password: '***' });
      const response = await userAPI.login(email, password);
      console.log('Full response:', response);
      console.log('response.data:', response.data);
      console.log('response.data.data:', response.data.data);

      if (!response.data.data) {
        throw new Error('Invalid response structure');
      }

      const { user, token } = response.data.data;
      console.log('Extracted user:', user);
      console.log('Extracted token:', token ? 'present' : 'missing');

      if (!user || !token) {
        throw new Error('Missing user or token in response');
      }

      login(user, token);
      toast.success('Login successful!');

      // Redirect based on role
      if (user.role === 'admin' || user.role === 'department_officer') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error full:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      const message = error.message || error.response?.data?.message || 'Login failed';
      console.error('Final error message:', message);
      try {
        toast.error(message);
      } catch (toastError) {
        console.error('Toast error:', toastError);
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Dashboard preview chart data
  const chartData = [
    { name: 'Mon', solved: 45, pending: 24 },
    { name: 'Tue', solved: 52, pending: 18 },
    { name: 'Wed', solved: 38, pending: 20 },
    { name: 'Thu', solved: 65, pending: 15 },
    { name: 'Fri', solved: 48, pending: 12 },
    { name: 'Sat', solved: 29, pending: 10 },
    { name: 'Sun', solved: 15, pending: 5 },
  ];

  return (
    <div className="login-page-container">
      {/* Left Side - Hero & Stats */}
      <div className="login-hero-section">
        <div className="hero-content">
          <h1>Building a Better Campus,<br /> <span className="highlight-text">Together.</span></h1>
          <p className="hero-subtitle">
            Report issues, track status, and contribute to your college community's improvement with our advanced campus management platform.
          </p>

          <div className="hero-stats-card">
            <div className="chart-header">
              <h3>Weekly Issue Resolution</h3>
              <div className="live-indicator">
                <span className="dot"></span> Live Data
              </div>
            </div>

            {/* Simple Graph Header Area */}
            <div className="chart-visualization">
              <div className="mock-graph">
                {chartData.map((d, i) => (
                  <div key={i} className="graph-bar-group">
                    <div className="bar-fill solved" style={{ height: `${d.solved}%` }}></div>
                    <span className="bar-label">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">5k+</span>
                <span className="stat-label">Issues Resolved</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">24h</span>
                <span className="stat-label">Avg. Response</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">95%</span>
                <span className="stat-label">Student Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-overlay"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-form-inner-wrapper">
          <div className="login-card">
            <div className="login-header">
              <div className="logo-icon">🎓</div>
              <h2>Campus-Help Desk</h2>
              <p>Sanitizing your account access</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group-modern">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn-modern-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              <p>New to Campus-Help?</p>
              <Link to="/register" className="link-modern">Create an account</Link>
            </div>

            <div className="demo-pills">
              <small>Quick Login:</small>
              <div className="pill-group">
                <span onClick={() => { setEmail('citizen@example.com'); setPassword('Password123!') }}>Student</span>
                <span onClick={() => { setEmail('admin@example.com'); setPassword('Password123!') }}>College Admin</span>
                <span onClick={() => { setEmail('officer@example.com'); setPassword('Password123!') }}>Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
