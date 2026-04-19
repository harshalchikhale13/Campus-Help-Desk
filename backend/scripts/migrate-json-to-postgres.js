/**
 * Migration Script: JSON Storage → PostgreSQL
 * 
 * Migrates all data from the JSON flat files (data/*.json)
 * into the PostgreSQL database (AWS RDS or local).
 * 
 * Usage:
 *   cd backend
 *   node scripts/migrate-json-to-postgres.js
 * 
 * Prerequisites:
 *   1. PostgreSQL database must be running and accessible
 *   2. Schema must be applied first (run schema.sql)
 *   3. .env must have correct DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
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
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const DATA_DIR = path.join(__dirname, '../../data');

function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filename}, skipping...`);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`  ❌ Error reading ${filename}:`, err.message);
    return [];
  }
}

async function migrate() {
  console.log('🚀 Starting JSON → PostgreSQL migration...');
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Data dir: ${DATA_DIR}\n`);

  const client = await pool.connect();

  try {
    // ========================================
    // 1. Migrate Users
    // ========================================
    const users = readJsonFile('users.json');
    let userCount = 0;
    for (const u of users) {
      try {
        await client.query(
          `INSERT INTO users (id, username, email, password, first_name, last_name, phone, role, department, is_active, profile_image, last_login, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [
            u.id, u.username, u.email, u.password,
            u.first_name, u.last_name, u.phone,
            u.role || 'student', u.department || null,
            u.is_active !== undefined ? u.is_active : true,
            u.profile_image || null, u.last_login || null,
            u.created_at || new Date().toISOString(),
            u.updated_at || u.created_at || new Date().toISOString()
          ]
        );
        userCount++;
      } catch (err) {
        console.error(`  ⚠️  Skipped user ${u.email}: ${err.message}`);
      }
    }
    if (users.length > 0) {
      const maxId = Math.max(...users.map(u => u.id));
      await client.query(`SELECT setval('users_id_seq', $1)`, [maxId]);
    }
    console.log(`✅ Migrated ${userCount}/${users.length} users`);

    // ========================================
    // 2. Migrate Departments
    // ========================================
    const departments = readJsonFile('departments.json');
    let deptCount = 0;
    for (const d of departments) {
      try {
        await client.query(
          `INSERT INTO departments (id, name, description, contact_email, contact_phone, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            d.id, d.name, d.description || null,
            d.contact_email || null, d.contact_phone || null,
            d.is_active !== undefined ? d.is_active : true,
            d.created_at || new Date().toISOString()
          ]
        );
        deptCount++;
      } catch (err) {
        console.error(`  ⚠️  Skipped department ${d.name}: ${err.message}`);
      }
    }
    if (departments.length > 0) {
      const maxId = Math.max(...departments.map(d => d.id));
      await client.query(`SELECT setval('departments_id_seq', $1)`, [maxId]);
    }
    console.log(`✅ Migrated ${deptCount}/${departments.length} departments`);

    // ========================================
    // 3. Migrate Complaints
    // ========================================
    const complaints = readJsonFile('complaints.json');
    let complaintCount = 0;
    for (const c of complaints) {
      try {
        await client.query(
          `INSERT INTO complaints
             (id, complaint_id, user_id, student_id, department, category, description,
              image_url, building_name, room_number, issue_location, status, priority,
              assigned_department_id, assigned_officer_id, resolution_description,
              estimated_resolution_date, actual_resolution_date, closed_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
           ON CONFLICT (id) DO NOTHING`,
          [
            c.id, c.complaint_id, c.user_id, c.student_id || null,
            c.department || null, c.category || 'other', c.description || null,
            c.image_url || null, c.building_name || null,
            c.room_number || null, c.issue_location || null,
            c.status || 'submitted', c.priority || 'medium',
            c.assigned_department_id || null, c.assigned_officer_id || null,
            c.resolution_description || null,
            c.estimated_resolution_date || null, c.actual_resolution_date || null,
            c.closed_at || null,
            c.created_at || new Date().toISOString(),
            c.updated_at || c.created_at || new Date().toISOString()
          ]
        );
        complaintCount++;
      } catch (err) {
        console.error(`  ⚠️  Skipped complaint ${c.complaint_id}: ${err.message}`);
      }
    }
    if (complaints.length > 0) {
      const maxId = Math.max(...complaints.map(c => c.id));
      await client.query(`SELECT setval('complaints_id_seq', $1)`, [maxId]);
    }
    console.log(`✅ Migrated ${complaintCount}/${complaints.length} complaints`);

    // ========================================
    // 4. Migrate Complaint Updates
    // ========================================
    const updates = readJsonFile('complaint_updates.json');
    let updateCount = 0;
    for (const u of updates) {
      try {
        await client.query(
          `INSERT INTO complaint_updates (id, complaint_id, updated_by, status_change, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [
            u.id, u.complaint_id, u.updated_by,
            u.status_change || null, u.comment || null,
            u.created_at || new Date().toISOString()
          ]
        );
        updateCount++;
      } catch (err) {
        console.error(`  ⚠️  Skipped update ${u.id}: ${err.message}`);
      }
    }
    if (updates.length > 0) {
      const maxId = Math.max(...updates.map(u => u.id));
      await client.query(`SELECT setval('complaint_updates_id_seq', $1)`, [maxId]);
    }
    console.log(`✅ Migrated ${updateCount}/${updates.length} complaint updates`);

    // ========================================
    // 5. Migrate Notifications
    // ========================================
    const notifications = readJsonFile('notifications.json');
    let notifCount = 0;
    for (const n of notifications) {
      try {
        await client.query(
          `INSERT INTO notifications (id, user_id, complaint_id, type, title, message, is_read, email_sent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            n.id, n.user_id, n.complaint_id || null,
            n.type, n.title, n.message || null,
            n.is_read || false, n.email_sent || false,
            n.created_at || new Date().toISOString()
          ]
        );
        notifCount++;
      } catch (err) {
        console.error(`  ⚠️  Skipped notification ${n.id}: ${err.message}`);
      }
    }
    if (notifications.length > 0) {
      const maxId = Math.max(...notifications.map(n => n.id));
      await client.query(`SELECT setval('notifications_id_seq', $1)`, [maxId]);
    }
    console.log(`✅ Migrated ${notifCount}/${notifications.length} notifications`);

    console.log('\n🎉 Migration complete!');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
