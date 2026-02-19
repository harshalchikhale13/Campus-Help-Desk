/**
 * User Controller
 * Handles user-related HTTP requests
 */
const userService = require('../services/userService');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * Register user
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, phone, role } = req.body;

  if (!username || !email || !password || !firstName || !lastName) {
    throw new ApiError(400, 'Missing required fields');
  }

  const result = await userService.registerUser({
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const result = await userService.loginUser(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, profileImage } = req.body;

  const user = await userService.updateUserProfile(req.user.id, {
    firstName,
    lastName,
    phone,
    profileImage,
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

/**
 * Get all users (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, role } = req.query;

  const result = await userService.getAllUsers(
    parseInt(limit),
    parseInt(offset),
    role
  );

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get user by ID (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Toggle user active status (Admin only)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.toggleUserStatus(id);

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  toggleUserStatus,
};
