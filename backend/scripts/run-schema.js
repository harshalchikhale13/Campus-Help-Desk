/**
 * Run schema.sql against the PostgreSQL database
 * Usage: node scripts/run-schema.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
    ? {
        ca: process.env.DB_SSL_CA
          ? fs.readFileSync(path.resolve(__dirname, '..', process.env.DB_SSL_CA)).toString()
          : undefined,
        rejectUnauthorized: !!process.env.DB_SSL_CA,
      }
    : false,
});

async function runSchema() {
  console.log('📦 Running schema.sql against the database...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}\n`);

  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

  const client = await pool.connect();
  try {
    await client.query(schemaSQL);
    console.log('✅ Schema applied successfully!');
    console.log('   Tables created: users, departments, complaints, complaint_updates, notifications');
    console.log('   Indexes and triggers created.');
  } catch (err) {
    console.error('❌ Schema failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema();
