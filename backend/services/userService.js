/**
 * User Service — PostgreSQL Version
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

  // Map roles: only student and staff are allowed via self-registration
  // admin accounts cannot be self-registered
  let role = 'student'; // default
  if (requestedRole === 'staff') {
    role = 'staff';
  } else if (requestedRole === 'student') {
    role = 'student';
  }
  // 'admin' cannot be self-registered

  try {
    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      throw new Error('Email or username already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name, phone, role, is_active, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, username, email, first_name, last_name, phone, role, created_at`,
      [username, email, hashedPassword, firstName, lastName, phone, role]
    );

    const user = result.rows[0];

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
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

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
  await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

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
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

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

  const result = await db.query(
    `UPDATE users
     SET first_name  = COALESCE($1, first_name),
         last_name   = COALESCE($2, last_name),
         phone       = COALESCE($3, phone),
         profile_image = COALESCE($4, profile_image)
     WHERE id = $5
     RETURNING id, username, email, first_name, last_name, phone, role`,
    [firstName, lastName, phone, profileImage, userId]
  );

  const updated = result.rows[0];
  if (!updated) {
    throw new Error('User not found');
  }

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
  let queryText;
  let params;

  if (role) {
    queryText = `SELECT id, username, email, first_name, last_name, phone, role, is_active, created_at
                 FROM users WHERE role = $1
                 ORDER BY created_at DESC
                 LIMIT $2 OFFSET $3`;
    params = [role, limit, offset];
  } else {
    queryText = `SELECT id, username, email, first_name, last_name, phone, role, is_active, created_at
                 FROM users
                 ORDER BY created_at DESC
                 LIMIT $1 OFFSET $2`;
    params = [limit, offset];
  }

  const result = await db.query(queryText, params);

  // Get total count
  const countQuery = role
    ? await db.query('SELECT COUNT(*) FROM users WHERE role = $1', [role])
    : await db.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countQuery.rows[0].count);

  return {
    users: result.rows.map((u) => ({
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

/**
 * Toggle user active status (Admin only)
 */
const toggleUserStatus = async (userId) => {
  const result = await db.query(
    `UPDATE users SET is_active = NOT is_active WHERE id = $1
     RETURNING id, username, email, first_name, last_name, role, is_active`,
    [parseInt(userId)]
  );

  const updated = result.rows[0];
  if (!updated) throw new Error('User not found');

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    firstName: updated.first_name,
    lastName: updated.last_name,
    role: updated.role,
    isActive: updated.is_active,
  };
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (userId) => {
  const findResult = await db.query('SELECT * FROM users WHERE id = $1', [parseInt(userId)]);
  const user = findResult.rows[0];

  if (!user) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Cannot delete admin accounts');

  await db.query('DELETE FROM users WHERE id = $1', [user.id]);

  return { id: user.id, username: user.username, email: user.email };
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
};
