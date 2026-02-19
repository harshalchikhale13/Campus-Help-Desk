/**
 * Navbar Component
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <span>🎓</span> Campus-Help Desk
        </Link>

        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          {user?.role === 'citizen' && (
            <>
              <Link to="/dashboard" className="nav-link">
                My Issues
              </Link>
              <Link to="/complaint/create" className="nav-link nav-link-primary">
                ✏️ Report Issue
              </Link>
            </>
          )}

          {(user?.role === 'admin' || user?.role === 'department_officer') && (
            <>
              <Link to="/admin" className="nav-link nav-link-primary">
                🎛️ Admin Dashboard
              </Link>
              <Link to="/dashboard" className="nav-link">
                All Issues
              </Link>
            </>
          )}

          <div className="nav-user">
            <Link to="/profile" className="nav-link">
              {user?.firstName || user?.username}
            </Link>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
}
