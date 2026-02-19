/**
 * User Service - JSON Storage Version
 * Business logic for user operations
 */
const db = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/jwtToken');

/**
 * Register new user
 */
const registerUser = async (userData) => {
  const { username, email, password, firstName, lastName, phone, role: requestedRole } = userData;

  // Map friendly role names; prevent admin self-registration
  let role = 'citizen'; // default
  if (requestedRole === 'staff') {
    role = 'staff';
  } else if (requestedRole === 'student') {
    role = 'citizen';
  }
  // 'admin' and 'department_officer' cannot be self-registered

  try {
    // Check if user already exists
    const existingUser = db.findOne('users.json', { email }) || db.findOne('users.json', { username });
    if (existingUser) {
      throw new Error('Email or username already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const user = db.insert('users.json', {
      username,
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      is_active: true,
      profile_image: null,
      last_login: new Date().toISOString(),
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    });

    return {
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
      },
      token,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 */
const loginUser = async (email, password) => {
  const user = db.findOne('users.json', { email });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.is_active) {
    throw new Error('Account is inactive');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  db.updateById('users.json', user.id, {
    last_login: new Date().toISOString(),
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const user = db.findById('users.json', userId);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    role: user.role,
    isActive: user.is_active,
    profileImage: user.profile_image,
    createdAt: user.created_at,
  };
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, updateData) => {
  const { firstName, lastName, phone, profileImage } = updateData;
  const user = db.findById('users.json', userId);

  if (!user) {
    throw new Error('User not found');
  }

  const updated = db.updateById('users.json', userId, {
    first_name: firstName || user.first_name,
    last_name: lastName || user.last_name,
    phone: phone || user.phone,
    profile_image: profileImage || user.profile_image,
  });

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    firstName: updated.first_name,
    lastName: updated.last_name,
    phone: updated.phone,
    role: updated.role,
  };
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (limit = 20, offset = 0, role = null) => {
  let users = db.getAll('users.json');

  if (role) {
    users = users.filter((u) => u.role === role);
  }

  const total = users.length;
  const paginatedUsers = users.slice(offset, offset + limit);

  return {
    users: paginatedUsers.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
    })),
    total,
    limit,
    offset,
  };
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  getAllUsers,
};
