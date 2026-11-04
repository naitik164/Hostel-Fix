const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = require('../src/config/db');

async function dryRunReport(shouldExecute = false) {
  const conn = await connectDB();
  console.log(`\n================================================================`);
  console.log(` HOSTELFIX — DATABASE CLEANUP DRY-RUN REPORT`);
  console.log(` Database: hostelfix (MongoDB Atlas)`);
  console.log(` Mode: ${shouldExecute ? 'EXECUTE DELETION' : 'DRY-RUN (NO CHANGES MADE)'}`);
  console.log(`================================================================\n`);

  const db = conn.connection.db;

  // 1. Identify Users
  const allUsers = await db.collection('users').find({}).toArray();
  const testUsers = [];
  const genuineUsers = [];

  for (const u of allUsers) {
    if (u.email.startsWith('audit.') || u.email.includes('.test@') || u.googleSub.startsWith('demo_')) {
      testUsers.push(u);
    } else {
      genuineUsers.push(u);
    }
  }

  console.log(`1. USERS COLLECTION:`);
  console.log(`   - Total users found: ${allUsers.length}`);
  console.log(`   - Genuine student records to PRESERVE: ${genuineUsers.length}`);
  genuineUsers.forEach(u => console.log(`     * [PRESERVE] ${u.email} (${u.name}) | googleSub: ${u.googleSub}`));
  console.log(`   - Test/Demo users proposed for DELETION: ${testUsers.length}`);
  testUsers.forEach(u => console.log(`     * [PROPOSED DELETION] ${u.email} (${u.name}) | Criteria: test email prefix 'audit.' or demo_ sub`));

  const testUserIds = testUsers.map(u => u._id);

  // 2. Identify Admins
  const allAdmins = await db.collection('admins').find({}).toArray();
  console.log(`\n2. ADMINS COLLECTION:`);
  console.log(`   - Total admin records found: ${allAdmins.length}`);
  allAdmins.forEach(a => console.log(`     * [PRESERVE] ${a.loginId} (${a.name}) | Role: ${a.role} | Chief Warden Account`));

  // 3. Identify Complaints
  const allComplaints = await db.collection('complaints').find({}).toArray();
  const testComplaints = [];
  const genuineComplaints = [];

  for (const c of allComplaints) {
    const isFromTestUser = testUserIds.some(id => id.toString() === c.studentId?.toString());
    const isTestTitle = c.title.includes('[VERIFICATION-TEST]') || c.title.includes('Student A');
    if (isFromTestUser || isTestTitle) {
      testComplaints.push(c);
    } else {
      genuineComplaints.push(c);
    }
  }

  console.log(`\n3. COMPLAINTS COLLECTION:`);
  console.log(`   - Total complaints found: ${allComplaints.length}`);
  console.log(`   - Genuine complaints to PRESERVE: ${genuineComplaints.length}`);
  genuineComplaints.forEach(c => console.log(`     * [PRESERVE] [${c.referenceId}] "${c.title}"`));
  console.log(`   - Test complaints proposed for DELETION: ${testComplaints.length}`);
  testComplaints.forEach(c => console.log(`     * [PROPOSED DELETION] [${c.referenceId}] "${c.title}" | Status: ${c.status} | Criteria: created by test suite`));

  const testComplaintIds = testComplaints.map(c => c._id);

  // 4. Identify Complaint Histories
  const testHistoriesCount = await db.collection('complainthistories').countDocuments({
    complaintId: { $in: testComplaintIds }
  });
  console.log(`\n4. COMPLAINTHISTORIES COLLECTION:`);
  console.log(`   - Proposed deletion count: ${testHistoriesCount}`);
  console.log(`   - Criteria: linked to test complaint IDs`);

  // 5. Identify Notifications
  const testNotificationsCount = await db.collection('notifications').countDocuments({
    $or: [
      { complaintId: { $in: testComplaintIds } },
      { recipientId: { $in: testUserIds } }
    ]
  });
  console.log(`\n5. NOTIFICATIONS COLLECTION:`);
  console.log(`   - Proposed deletion count: ${testNotificationsCount}`);
  console.log(`   - Criteria: linked to test complaints or test student IDs`);

  // 6. Identify Sessions
  const testSessionsCount = await db.collection('sessions').countDocuments({
    userId: { $in: testUserIds }
  });
  console.log(`\n6. SESSIONS COLLECTION:`);
  console.log(`   - Proposed deletion count: ${testSessionsCount}`);
  console.log(`   - Criteria: active/expired sessions created during audit tests for test users`);

  // 7. System Infrastructure (Blocks & Settings)
  const blocksCount = await db.collection('hostelblocks').countDocuments();
  const settingsCount = await db.collection('settings').countDocuments();
  console.log(`\n7. INFRASTRUCTURE & CONFIGURATION (ALWAYS PRESERVED):`);
  console.log(`   - hostelblocks: ${blocksCount} records [ALL PRESERVED]`);
  console.log(`   - settings: ${settingsCount} records [ALL PRESERVED]`);

  console.log(`\n================================================================`);
  console.log(` SUMMARY OF PROPOSED CLEANUP:`);
  console.log(` - Users to delete        : ${testUsers.length}`);
  console.log(` - Complaints to delete   : ${testComplaints.length}`);
  console.log(` - Histories to delete    : ${testHistoriesCount}`);
  console.log(` - Notifications to delete: ${testNotificationsCount}`);
  console.log(` - Test Sessions to delete: ${testSessionsCount}`);
  console.log(` - Genuine users preserved: ${genuineUsers.length} (${genuineUsers.map(u => u.email).join(', ')})`);
  console.log(` - Genuine admins preserved: ${allAdmins.length} (${allAdmins.map(a => a.loginId).join(', ')})`);
  console.log(` - Blocks preserved       : ${blocksCount}`);
  console.log(` - Settings preserved     : ${settingsCount}`);
  console.log(`================================================================\n`);

  if (shouldExecute) {
    if (process.env.CONFIRM_CLEANUP !== 'YES_CLEANUP_TEST_RECORDS') {
      console.log('[SAFETY BLOCKED]: Deletion aborted. Set CONFIRM_CLEANUP="YES_CLEANUP_TEST_RECORDS" to proceed.');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('[EXECUTING CLEANUP]: Removing confirmed test records...');
    if (testComplaintIds.length > 0) {
      await db.collection('complaints').deleteMany({ _id: { $in: testComplaintIds } });
      await db.collection('complainthistories').deleteMany({ complaintId: { $in: testComplaintIds } });
    }
    if (testUserIds.length > 0) {
      await db.collection('users').deleteMany({ _id: { $in: testUserIds } });
      await db.collection('sessions').deleteMany({ userId: { $in: testUserIds } });
      await db.collection('notifications').deleteMany({
        $or: [
          { complaintId: { $in: testComplaintIds } },
          { recipientId: { $in: testUserIds } }
        ]
      });
    }
    console.log('✓ Confirmed test records removed successfully.');
  } else {
    console.log('NOTE: This was a DRY-RUN. NO records were deleted.');
    console.log('To execute cleanup after explicit user confirmation:');
    console.log('  CONFIRM_CLEANUP=YES_CLEANUP_TEST_RECORDS node scripts/cleanupDryRun.js --execute\n');
  }

  await mongoose.connection.close();
  process.exit(0);
}

const isExecute = process.argv.includes('--execute');
dryRunReport(isExecute).catch(err => {
  console.error('[Dry-Run Error]:', err);
  process.exit(1);
});
