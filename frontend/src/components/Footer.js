/**
 * Footer Component
 */
import React from 'react';
import '../styles/Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About</h3>
            <p>
              Campus-Help Desk enables students to report and monitor campus-related issues efficiently, improving communication and issue resolution within the college.
            </p>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: support@civiccomplaints.com</p>
            <p>Phone: +1-800-COMPLAINT</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} College Complaint Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
