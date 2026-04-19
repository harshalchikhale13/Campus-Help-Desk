/**
 * PostgreSQL Database Configuration
 * Connects to AWS RDS PostgreSQL with SSL (verify-full)
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Build SSL configuration
let sslConfig = false;
if (process.env.DB_SSL === 'true') {
  sslConfig = {};

  // Load CA certificate for verify-full mode (AWS RDS global-bundle.pem)
  const caPath = process.env.DB_SSL_CA;
  if (caPath) {
    const resolvedPath = path.resolve(__dirname, '..', caPath);
    if (fs.existsSync(resolvedPath)) {
      sslConfig.ca = fs.readFileSync(resolvedPath).toString();
      sslConfig.rejectUnauthorized = true; // verify-full
      console.log('🔒 SSL: verify-full mode (CA cert loaded)');
    } else {
      console.warn(`⚠️  SSL CA cert not found at: ${resolvedPath}, falling back to rejectUnauthorized=false`);
      sslConfig.rejectUnauthorized = false;
    }
  } else {
    // No CA cert specified — connect with encryption but skip verification
    sslConfig.rejectUnauthorized = false;
    console.log('🔒 SSL: require mode (no CA cert, skipping verification)');
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'civic_complaints_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,                       // max connections in pool
  idleTimeoutMillis: 30000,      // close idle connections after 30s
  connectionTimeoutMillis: 10000, // 10s timeout for RDS connections
  ssl: sslConfig,
});

// Test the connection on startup
pool.connect()
  .then((client) => {
    console.log('✅ Connected to PostgreSQL');
    console.log(`   Database: ${process.env.DB_NAME || 'civic_complaints_db'}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    client.release();
  })
  .catch((err) => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
  });

/**
 * Run a parameterized query
 * @param {string} text - SQL query text with $1, $2, ... placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', {
      text: text.substring(0, 80),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
  }
  return result;
};

/**
 * Get a client from the pool for transactions
 * Remember to call client.release() when done
 * @returns {Promise<import('pg').PoolClient>}
 */
const getClient = async () => {
  return await pool.connect();
};

module.exports = { pool, query, getClient };
