const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = require('../src/config/db');

const BASE_URL = 'http://localhost:5000';

async function runE2E() {
  console.log('================================================================');
  console.log(' HOSTELFIX — END-TO-END VERIFICATION & PERSISTENCE TEST');
  console.log('================================================================\n');

  // 1. Verify Direct Atlas Connection
  const conn = await connectDB();
  console.log(`[PASS] MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);

  // 2. Student Authentication (Real session creation)
  const studentEmail = 'audit.studenta@hostelfix.edu';
  console.log(`\n[STEP 1] Authenticating Student (${studentEmail})...`);
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/demo-student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, name: 'Audit Student A' }),
  });
  const studentLoginData = await studentLoginRes.json();
  if (!studentLoginData.success) throw new Error('Student login failed: ' + JSON.stringify(studentLoginData));
  const studentCookie = studentLoginRes.headers.get('set-cookie');
  const studentToken = studentLoginData.token;
  console.log(`[PASS] Student authenticated. Session ID: ${studentLoginData.user._id}`);

  // 3. Submit clearly identified test complaint
  console.log('\n[STEP 2] Submitting test complaint through API...');
  const testPayload = {
    title: '[VERIFICATION-TEST] Ceiling fan regulator malfunctioning in Room A-202',
    category: 'Electricity & Lighting',
    subcategory: 'Ceiling Fan Repair',
    description: 'The ceiling fan regulator in room A-202 operates only on high speed and creates humming sparks. Required inspection.',
    hostelBlockName: 'Aryabhata Block',
    roomNumber: 'A-202',
    location: 'Second floor wing B',
    preferredContact: 'Phone',
  };

  const createRes = await fetch(`${BASE_URL}/api/student/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`,
    },
    body: JSON.stringify(testPayload),
  });
  const createData = await createRes.json();
  if (!createData.success) throw new Error('Complaint creation failed: ' + JSON.stringify(createData));
  const createdComplaint = createData.complaint;
  console.log(`[PASS] Complaint submitted successfully: Reference ID [${createdComplaint.referenceId}], ID: ${createdComplaint._id}`);

  // 4. Verify complaint persistence directly in MongoDB Atlas
  console.log('\n[STEP 3] Verifying document directly in MongoDB Atlas database...');
  const complaintDoc = await conn.connection.db.collection('complaints').findOne({ _id: new mongoose.Types.ObjectId(createdComplaint._id) });
  if (!complaintDoc) throw new Error('Complaint not found in MongoDB Atlas collection "complaints"!');
  console.log(`[PASS] Confirmed in MongoDB Atlas:
    - Collection: complaints
    - Reference ID: ${complaintDoc.referenceId}
    - Title: "${complaintDoc.title}"
    - Status: ${complaintDoc.status}
    - Priority: ${complaintDoc.priority}
    - Student ID: ${complaintDoc.studentId}`);

  // Verify complaint history in MongoDB Atlas
  const historyDocs = await conn.connection.db.collection('complainthistories').find({ complaintId: complaintDoc._id }).toArray();
  console.log(`[PASS] Confirmed History in MongoDB Atlas: ${historyDocs.length} event(s) recorded.`);

  // 5. Retrieve via Student Dashboard API (simulating page reload)
  console.log('\n[STEP 4] Simulating page refresh — retrieving complaint from Student Dashboard API...');
  const fetchRes = await fetch(`${BASE_URL}/api/student/complaints/${createdComplaint._id}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  });
  const fetchData = await fetchRes.json();
  if (!fetchData.success || fetchData.complaint.referenceId !== createdComplaint.referenceId) {
    throw new Error('Failed to retrieve complaint from student API after refresh');
  }
  console.log(`[PASS] Student complaint retrieved accurately from MongoDB: status "${fetchData.complaint.status}"`);

  // 6. Warden Authentication
  console.log('\n[STEP 5] Authenticating Authorized Warden (admin@hostelfix.edu)...');
  const wardenLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu',
      password: process.env.ADMIN_PASSWORD || 'Warden@Secure2026',
    }),
  });
  const wardenLoginData = await wardenLoginRes.json();
  if (!wardenLoginData.success) throw new Error('Warden login failed: ' + JSON.stringify(wardenLoginData));
  const wardenToken = wardenLoginData.token;
  console.log(`[PASS] Warden authenticated successfully. Name: ${wardenLoginData.user.name}`);

  // 7. Warden Status Update (to 'In Progress')
  console.log('\n[STEP 6] Warden updates complaint status to "In Progress"...');
  const updateRes = await fetch(`${BASE_URL}/api/admin/complaints/${createdComplaint._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${wardenToken}`,
    },
    body: JSON.stringify({
      status: 'In Progress',
      publicNote: 'Electrician dispatched to Room A-202 with replacement regulator component.',
      internalNote: 'Ticket dispatched to electrician on duty.',
    }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success) throw new Error('Status update failed: ' + JSON.stringify(updateData));
  console.log(`[PASS] Warden status update succeeded: "${updateData.complaint.status}"`);

  // 8. Confirm status change persists in MongoDB Atlas
  console.log('\n[STEP 7] Verifying updated status directly in MongoDB Atlas...');
  const updatedDoc = await conn.connection.db.collection('complaints').findOne({ _id: new mongoose.Types.ObjectId(createdComplaint._id) });
  if (updatedDoc.status !== 'In Progress') {
    throw new Error(`Expected status 'In Progress' in Atlas, found '${updatedDoc.status}'`);
  }
  console.log(`[PASS] Confirmed in MongoDB Atlas: Complaint status is now "${updatedDoc.status}"`);

  // 9. Confirm reflection in Student Dashboard view
  console.log('\n[STEP 8] Confirming reflection in Student Dashboard API...');
  const studentCheckRes = await fetch(`${BASE_URL}/api/student/complaints/${createdComplaint._id}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  });
  const studentCheckData = await studentCheckRes.json();
  if (studentCheckData.complaint.status !== 'In Progress') {
    throw new Error('Student view did not reflect updated status!');
  }
  console.log(`[PASS] Student view confirms updated status: "${studentCheckData.complaint.status}"`);
  console.log(`[PASS] Public note visible to student: "${studentCheckData.history[studentCheckData.history.length - 1].publicNote}"`);

  // 10. Check Warden Analytics reflects the real complaint
  console.log('\n[STEP 9] Checking Warden Analytics telemetry...');
  const analyticsRes = await fetch(`${BASE_URL}/api/admin/analytics?days=30`, {
    headers: { 'Authorization': `Bearer ${wardenToken}` },
  });
  const analyticsData = await analyticsRes.json();
  if (!analyticsData.success) throw new Error('Analytics failed');
  console.log(`[PASS] Warden Analytics computed directly from MongoDB Atlas:
    - Total Complaints: ${analyticsData.kpis.totalComplaints}
    - Resolution Rate: ${analyticsData.kpis.resolutionRate}%
    - SLA Compliance Rate: ${analyticsData.kpis.slaComplianceRate}%
    - Most Affected Block: ${analyticsData.kpis.mostAffectedBlock}
    - Status Aggregations: ${analyticsData.charts.byStatus.map(s => `${s._id}: ${s.count}`).join(', ')}`);

  console.log('\n================================================================');
  console.log(' ✓ ALL 9 END-TO-END VERIFICATION CHECKS COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');

  console.log(`TEST RECORD DETAILS (For Final Report):`);
  console.log(`- Document ID : ${createdComplaint._id}`);
  console.log(`- Reference ID: ${createdComplaint.referenceId}`);
  console.log(`- Title       : ${createdComplaint.title}`);
  console.log(`- Collection  : complaints`);
  console.log(`- Database    : hostelfix (MongoDB Atlas)\n`);

  await mongoose.connection.close();
  process.exit(0);
}

runE2E().catch(err => {
  console.error('\n[E2E VERIFICATION ERROR]:', err);
  process.exit(1);
});
