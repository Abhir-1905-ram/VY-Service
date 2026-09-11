/**
 * MongoDB → Supabase Migration Script
 *
 * Prerequisites:
 *   1. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY filled in .env
 *   2. MONGODB_URI filled in .env
 *   3. Run schema.sql in Supabase SQL Editor first
 *   4. Run:  node backend/migrate.js
 *
 * The script migrates: employees → repairs → attendance (in order).
 * It is safe to re-run: it skips rows that already exist (by username / unique_id / employee+date).
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGODB_URI || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars. Set MONGODB_URI, SUPABASE_URL and SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

if (SUPABASE_URL.includes('your-project-ref')) {
  console.error('❌ SUPABASE_URL still has the placeholder value. Please fill in .env with real credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function assertTablesExist() {
  const { error } = await supabase.from('employees').select('id').limit(1);
  if (error) {
    console.error('\n❌ Supabase tables are not created yet.');
    console.error(`   ${error.message}`);
    console.error('\n   Open Supabase → SQL Editor, paste backend/supabase/schema.sql, click Run.');
    console.error('   Then run: node migrate.js\n');
    process.exit(1);
  }
}

// Maps MongoDB ObjectId string → Supabase UUID (for attendance.employee_id)
const employeeIdMap = new Map();

async function migrateEmployees(db) {
  console.log('\n📋 Migrating employees...');
  const employees = await db.collection('employees').find({}).toArray();
  console.log(`   Found ${employees.length} employees in MongoDB`);

  let inserted = 0, skipped = 0, failed = 0;

  for (const emp of employees) {
    // Check if already migrated (by username)
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('username', emp.username)
      .maybeSingle();

    if (existing) {
      employeeIdMap.set(emp._id.toString(), existing.id);
      skipped++;
      continue;
    }

    const payload = {
      username: emp.username,
      password: emp.password,
      is_approved: emp.isApproved || false,
      allowed_cards: Array.isArray(emp.allowedCards) ? emp.allowedCards : ['repair-service', 'repair-list', 'attendance'],
      can_remove_repairs: emp.canRemoveRepairs || false,
      created_at: emp.createdAt ? new Date(emp.createdAt).toISOString() : new Date().toISOString(),
      updated_at: emp.updatedAt ? new Date(emp.updatedAt).toISOString() : new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Employee "${emp.username}": ${error.message}`);
      failed++;
    } else {
      employeeIdMap.set(emp._id.toString(), data.id);
      inserted++;
    }
  }

  console.log(`   ✅ Inserted: ${inserted} | Skipped (already exist): ${skipped} | Failed: ${failed}`);
}

async function migrateRepairs(db) {
  console.log('\n🔧 Migrating repairs...');
  const repairs = await db.collection('repairs').find({}).toArray();
  console.log(`   Found ${repairs.length} repairs in MongoDB`);

  let inserted = 0, failed = 0;
  const BATCH = 50;

  for (let i = 0; i < repairs.length; i += BATCH) {
    const batch = repairs.slice(i, i + BATCH);
    const rows = batch.map(r => ({
      unique_id: r.uniqueId || '',
      customer_name: r.customerName || '',
      phone_number: r.phoneNumber || '',
      type: r.type || '',
      brand: r.brand || '',
      adapter_given: r.adapterGiven !== undefined ? r.adapterGiven : null,
      problem: r.problem || '',
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      delivered_at: r.deliveredAt ? new Date(r.deliveredAt).toISOString() : null,
      status: ['Pending', 'Completed', 'Not Completed'].includes(r.status) ? r.status : 'Pending',
      remark: r.remark || '',
      created_by: r.createdBy || '',
      amount: r.amount != null ? Number(r.amount) : null,
      expected_amount: r.expectedAmount != null ? Number(r.expectedAmount) : null,
      updated_at: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));

    const { error } = await supabase.from('repairs').insert(rows);
    if (error) {
      console.error(`   ❌ Batch ${i}–${i + batch.length}: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, repairs.length)}/${repairs.length}`);
  }

  console.log(`\n   ✅ Inserted: ${inserted} | Failed: ${failed}`);
}

async function migrateAttendance(db) {
  console.log('\n📅 Migrating attendance...');
  const records = await db.collection('attendances').find({}).toArray();
  console.log(`   Found ${records.length} attendance records in MongoDB`);

  if (employeeIdMap.size === 0) {
    console.warn('   ⚠️  No employee ID map — fetching from Supabase to rebuild...');
    const { data: emps } = await supabase.from('employees').select('id, username');
    // We can't rebuild the ObjectId→UUID map without the original Mongo docs,
    // so attendance migration requires employees to be migrated in the same run.
    console.error('   ❌ Run migration with employees first (fresh run). Skipping attendance.');
    return;
  }

  let inserted = 0, skipped = 0, failed = 0;
  const BATCH = 50;

  // Build batches
  const rows = [];
  for (const rec of records) {
    const mongoEmpId = rec.employeeId ? rec.employeeId.toString() : null;
    const supabaseEmpId = mongoEmpId ? employeeIdMap.get(mongoEmpId) : null;

    if (!supabaseEmpId) {
      console.warn(`   ⚠️  No mapping for employeeId ${mongoEmpId} — skipping attendance record`);
      skipped++;
      continue;
    }

    rows.push({
      employee_id: supabaseEmpId,
      employee_name: rec.employeeName || null,
      date: rec.date || '',
      ip_address: rec.ipAddress || '',
      lat: rec.lat != null ? Number(rec.lat) : null,
      lng: rec.lng != null ? Number(rec.lng) : null,
      accuracy: rec.accuracy != null ? Number(rec.accuracy) : null,
      timestamp: rec.timestamp ? new Date(rec.timestamp).toISOString() : new Date().toISOString(),
      created_at: rec.createdAt ? new Date(rec.createdAt).toISOString() : new Date().toISOString(),
      updated_at: rec.updatedAt ? new Date(rec.updatedAt).toISOString() : new Date().toISOString(),
    });
  }

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('attendance')
      .upsert(batch, { onConflict: 'employee_id,date', ignoreDuplicates: true });

    if (error) {
      console.error(`   ❌ Batch ${i}: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log(`\n   ✅ Inserted/updated: ${inserted} | Skipped (no emp mapping): ${skipped} | Failed: ${failed}`);
}

async function main() {
  console.log('🚀 Starting MongoDB → Supabase migration');
  console.log(`   Source: MongoDB Atlas`);
  console.log(`   Target: ${SUPABASE_URL}`);

  const mongo = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });

  try {
    await mongo.connect();
    console.log('✅ Connected to MongoDB');
    await assertTablesExist();
    console.log('✅ Supabase tables found');

    const dbName = new URL(MONGODB_URI.replace('mongodb+srv://', 'https://')).pathname.replace('/', '').split('?')[0] || 'vy-service';
    const db = mongo.db(dbName);

    await migrateEmployees(db);
    await migrateRepairs(db);
    await migrateAttendance(db);

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await mongo.close();
  }
}

main();
