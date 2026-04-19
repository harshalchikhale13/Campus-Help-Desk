/**
 * Main Express Server
 * Entry point for the civic complaint management system backend
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// ========== SECURITY MIDDLEWARE ==========

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Dynamically mirror the origin to allow the AWS LoadBalancer frontend to connect
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 20, // allow 20 login attempts per hour
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/users/login', authLimiter);
// Note: register is NOT rate-limited by authLimiter (admins may register multiple staff)

// ========== BODY PARSER MIDDLEWARE ==========

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========== LOGGING MIDDLEWARE ==========

app.use(requestLogger);

// ========== STATIC FILES ==========

app.use('/uploads', express.static('uploads'));

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.send('City Help Desk Backend is running');
});

app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const db = require('./config/database');
    await db.query('SELECT 1');
    res.json({
      success: true,
      message: 'Server is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Server is running but database is unreachable',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ========== API ROUTES ==========

// User routes
app.use('/api/users', userRoutes);

// Complaint routes
app.use('/api/complaints', complaintRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// AI routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Admin routes (protected)
app.use('/api/admin', adminRoutes);

// ========== ERROR HANDLING ==========

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ========== SERVER STARTUP ==========

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend Server Running on Port ${PORT}`);
});

// Handle unhandled rejections (but don't exit)
process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err.message);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit, allow server to continue running
});

module.exports = app;
