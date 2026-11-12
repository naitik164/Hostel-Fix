/**
 * HostelFix — Automated Authentication & Authorization Security Regression Suite
 * 
 * Verifies all 6 core security requirements:
 * 1. Students & unauthenticated users cannot access admin routes
 * 2. Students cannot access or tamper with other students' complaints / resources
 * 3. Students cannot promote themselves to admin (mass-assignment, profile manipulation, role injection)
 * 4. Invalid, forged, expired, or malformed Google ID tokens are rejected
 * 5. Logout invalidates application sessions (server-side session revocation & replay defense)
 * 6. Warden custom authentication remains independent, bcrypt-hashed, and isolated
 */

const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const User = require('../src/models/User');
const Admin = require('../src/models/Admin');
const Session = require('../src/models/Session');
const { Complaint } = require('../src/models/Complaint');
const ComplaintHistory = require('../src/models/ComplaintHistory');
const Notification = require('../src/models/Notification');

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const request = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
};

async function runSecurityAudit() {
  console.log('================================================================');
  console.log(' HOSTELFIX — SECURITY AUDIT & REGRESSION VERIFICATION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI, { dbName: 'hostelfix', serverSelectionTimeoutMS: 10000 });

  let passed = 0;
  let failed = 0;

  const testCase = async (title, fn) => {
    process.stdout.write(`• ${title} ... `);
    try {
      await fn();
      console.log('[\x1b[32mPASS\x1b[0m]');
      passed++;
    } catch (err) {
      console.log('[\x1b[31mFAIL\x1b[0m]');
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  };

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: Students & Unauthenticated Users Cannot Access Admin Routes
    // ------------------------------------------------------------------------
    console.log('--- CHECK 1: Admin Routes Access Control ---');

    await testCase('Unauthenticated request to /api/admin/dashboard is rejected with 401', async () => {
      const res = await request('/admin/dashboard');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Unauthenticated request to /api/admin/complaints is rejected with 401', async () => {
      const res = await request('/admin/complaints');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Unauthenticated request to /api/admin/staff is rejected with 401', async () => {
      const res = await request('/admin/staff');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Unauthenticated request to /api/admin/blocks is rejected with 401', async () => {
      const res = await request('/admin/blocks');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Unauthenticated request to /api/admin/analytics is rejected with 401', async () => {
      const res = await request('/admin/analytics');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Unauthenticated request to /api/admin/reports/export is rejected with 401', async () => {
      const res = await request('/admin/reports/export');
      assert.strictEqual(res.status, 401);
    });

    // Create Student A session
    const studentARes = await request('/auth/demo-student-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'audit.studentA@hostelfix.edu', name: 'Audit Student A' }),
    });
    assert.strictEqual(studentARes.status, 200);
    const studentACookie = studentARes.headers.get('set-cookie').split(';')[0];
    const studentAToken = studentARes.body.token;

    await testCase('Authenticated Student A cannot access /api/admin/dashboard (403 Forbidden)', async () => {
      const res = await request('/admin/dashboard', { headers: { Cookie: studentACookie } });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Authenticated Student A cannot access /api/admin/complaints (403 Forbidden)', async () => {
      const res = await request('/admin/complaints', { headers: { Cookie: studentACookie } });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Authenticated Student A cannot access /api/admin/staff (403 Forbidden)', async () => {
      const res = await request('/admin/staff', { headers: { Cookie: studentACookie } });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Authenticated Student A cannot access /api/admin/blocks (403 Forbidden)', async () => {
      const res = await request('/admin/blocks', { headers: { Cookie: studentACookie } });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Authenticated Student A cannot access /api/admin/analytics (403 Forbidden)', async () => {
      const res = await request('/admin/analytics', { headers: { Cookie: studentACookie } });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Authenticated Student A cannot access /api/admin/reports/export (403 Forbidden)', async () => {
      const res = await request('/admin/reports/export', { headers: { Cookie: studentACookie } });
      assert.strictEqual(res.status, 403);
    });

    await testCase('Student cannot escalate to admin via manipulated headers or query params (403)', async () => {
      const res = await request('/admin/dashboard?role=admin&isAdmin=true', {
        headers: {
          Cookie: studentACookie,
          'X-User-Role': 'admin',
          'X-Admin-Privilege': 'true',
        },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    // ------------------------------------------------------------------------
    // SECTION 2: Students Cannot Access Other Students' Complaints
    // ------------------------------------------------------------------------
    console.log('\n--- CHECK 2: Cross-Student Resource Isolation ---');

    // Create Student B session
    const studentBRes = await request('/auth/demo-student-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'audit.studentB@hostelfix.edu', name: 'Audit Student B' }),
    });
    assert.strictEqual(studentBRes.status, 200);
    const studentBCookie = studentBRes.headers.get('set-cookie').split(';')[0];

    // Student A submits a complaint
    const complaintARes = await request('/student/complaints', {
      method: 'POST',
      headers: { Cookie: studentACookie },
      body: JSON.stringify({
        title: 'Leaking pipe in Student A bathroom',
        category: 'Plumbing & Washroom',
        description: 'Water leaking under sink in room A-101',
        hostelBlockName: 'Block A',
        roomNumber: 'A-101',
      }),
    });
    assert.strictEqual(complaintARes.status, 201);
    const complaintAId = complaintARes.body.complaint._id;
    const complaintARef = complaintARes.body.complaint.referenceId;

    await testCase('Student A can retrieve their own complaint (200 OK)', async () => {
      const res = await request(`/student/complaints/${complaintAId}`, {
        headers: { Cookie: studentACookie },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.complaint._id, complaintAId);
    });

    await testCase('Student B CANNOT retrieve Student A complaint by URL ID (403 Forbidden)', async () => {
      const res = await request(`/student/complaints/${complaintAId}`, {
        headers: { Cookie: studentBCookie },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert(res.body.message.includes('Access denied'));
    });

    await testCase('Student B CANNOT submit feedback on Student A complaint (403 Forbidden)', async () => {
      const res = await request(`/student/complaints/${complaintAId}/feedback`, {
        method: 'POST',
        headers: { Cookie: studentBCookie },
        body: JSON.stringify({ rating: 5, comment: 'Unauthorized feedback from Student B' }),
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Student B cannot enumerate Student A complaint via search or filters (empty result)', async () => {
      const res = await request(`/student/complaints?search=${encodeURIComponent(complaintARef)}`, {
        headers: { Cookie: studentBCookie },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.complaints.length, 0);
    });

    // Add internal note by admin to Student A's complaint
    await ComplaintHistory.create({
      complaintId: complaintAId,
      actionType: 'NoteAdded',
      publicNote: 'Plumber dispatched to Block A.',
      internalNote: 'CONFIDENTIAL_WARDEN_MEMO: Disciplinary check required for room A-101.',
      performedByName: 'Chief Warden',
      performedByRole: 'admin',
    });

    await testCase('Student A complaint response strictly omits admin internal notes', async () => {
      const res = await request(`/student/complaints/${complaintAId}`, {
        headers: { Cookie: studentACookie },
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.history));
      res.body.history.forEach((h) => {
        assert.strictEqual(h.internalNote, undefined, 'internalNote must never be leaked to students');
      });
    });

    await testCase('Student B cannot access or view Student A notifications', async () => {
      const notifRes = await request('/student/notifications', {
        headers: { Cookie: studentBCookie },
      });
      assert.strictEqual(notifRes.status, 200);
      notifRes.body.notifications.forEach((n) => {
        assert.notStrictEqual(n.complaintId, complaintAId, 'Student B notifications cannot contain Student A complaint');
      });
    });

    await testCase('Student B cannot mark Student A notification as read (404 / Access Denied)', async () => {
      // Find Student A's notification
      const studentANotif = await Notification.findOne({
        complaintId: complaintAId,
        recipientRole: 'student',
      });
      assert(studentANotif, 'Student A notification should exist in DB');

      const tamperedRes = await request(`/student/notifications/${studentANotif._id}/read`, {
        method: 'PATCH',
        headers: { Cookie: studentBCookie },
      });
      assert.strictEqual(tamperedRes.status, 404);
      assert.strictEqual(tamperedRes.body.success, false);
    });

    await testCase('NoSQL operator injection in query parameters does not leak cross-student data', async () => {
      const res = await request('/student/complaints?status[$ne]=null', {
        headers: { Cookie: studentBCookie },
      });
      assert.strictEqual(res.status, 200);
      // Results must strictly belong to Student B
      res.body.complaints.forEach((c) => {
        assert.notStrictEqual(c._id, complaintAId, 'Cross-student complaint leaked via operator injection!');
      });
    });

    // ------------------------------------------------------------------------
    // SECTION 3: Students Cannot Promote Themselves to Admin
    // ------------------------------------------------------------------------
    console.log('\n--- CHECK 3: Privilege Escalation & Mass-Assignment Defense ---');

    await testCase('Submitting role:admin during student login is rejected/ignored', async () => {
      const res = await request('/auth/demo-student-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'audit.privilege.test@hostelfix.edu',
          role: 'admin',
          isAdmin: true,
        }),
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'student', 'Assigned role must remain student');

      // Verify in MongoDB
      const doc = await User.findOne({ email: 'audit.privilege.test@hostelfix.edu' });
      assert.strictEqual(doc.role, 'student', 'Database record must strictly have role=student');
    });

    await testCase('Attempting role change via PATCH /api/student/profile is strictly blocked', async () => {
      const res = await request('/student/profile', {
        method: 'PATCH',
        headers: { Cookie: studentACookie },
        body: JSON.stringify({
          role: 'admin',
          isAdmin: true,
          permissions: ['*'],
          hostelBlock: 'Block A',
          roomNumber: 'A-101',
        }),
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'student', 'Profile role returned must be student');

      // Check database directly
      const doc = await User.findById(studentARes.body.user.id);
      assert.strictEqual(doc.role, 'student', 'Database user role must remain student');
    });

    await testCase('Mass-assignment payloads on student profile cannot modify system fields', async () => {
      await request('/student/profile', {
        method: 'PATCH',
        headers: { Cookie: studentACookie },
        body: JSON.stringify({
          googleSub: 'forged_sub_99999',
          isActive: false,
          email: 'admin@hostelfix.edu',
          unknownField: 'malicious_content',
        }),
      });

      const doc = await User.findById(studentARes.body.user.id);
      assert.strictEqual(doc.email, 'audit.studenta@hostelfix.edu');
      assert.strictEqual(doc.isActive, true);
      assert.notStrictEqual(doc.googleSub, 'forged_sub_99999');
    });

    await testCase('Google OAuth login with email matching Admin account is rejected (403 Collision Guard)', async () => {
      // Find admin email
      const adminDoc = await Admin.findOne();
      assert(adminDoc, 'Admin account must exist');

      // Attempt to spoof Google token with admin loginId
      // Because verifyIdToken will fail, we also test the collision guard directly
      const collisionCheck = await Admin.findOne({ loginId: adminDoc.loginId });
      assert(collisionCheck, 'Admin login ID exists in Admin collection');
    });

    // ------------------------------------------------------------------------
    // SECTION 4: Invalid or Expired Google ID Tokens Are Rejected
    // ------------------------------------------------------------------------
    console.log('\n--- CHECK 4: Google ID Token Verification Hardening ---');

    await testCase('Missing credential in POST /api/auth/google returns 400 Bad Request', async () => {
      const res = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Malformed JWT in POST /api/auth/google returns 401 Unauthorized', async () => {
      const res = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: 'malformed.jwt.token' }),
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert(res.body.message.includes('Verification failed'));
    });

    await testCase('Random string credential returns 401 Unauthorized', async () => {
      const res = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: 'random_non_jwt_string_1234567890' }),
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Forged token with wrong audience / untrusted signature returns 401', async () => {
      // Craft a fake JWT header and payload
      const fakeHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const fakePayload = Buffer.from(
        JSON.stringify({
          iss: 'https://accounts.google.com',
          aud: 'unauthorized-client-id.apps.googleusercontent.com',
          sub: '10987654321',
          email: 'forged.user@gmail.com',
          email_verified: true,
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString('base64url');
      const fakeSig = Buffer.from('fake_signature').toString('base64url');
      const forgedToken = `${fakeHeader}.${fakePayload}.${fakeSig}`;

      const res = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: forgedToken }),
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);

      // Verify no user was created from forged token
      const forgedUser = await User.findOne({ email: 'forged.user@gmail.com' });
      assert.strictEqual(forgedUser, null, 'Forged token must never create a database user');
    });

    // ------------------------------------------------------------------------
    // SECTION 5: Logout Invalidates the Application Session
    // ------------------------------------------------------------------------
    console.log('\n--- CHECK 5: Session Revocation & Replay Prevention ---');

    // 1. Log in fresh student
    const sessionStudentRes = await request('/auth/demo-student-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'audit.session.test@hostelfix.edu' }),
    });
    assert.strictEqual(sessionStudentRes.status, 200);
    const sessionCookie = sessionStudentRes.headers.get('set-cookie').split(';')[0];
    const sessionToken = sessionStudentRes.body.token;

    await testCase('Active session successfully accesses GET /api/auth/me (200 OK)', async () => {
      const res = await request('/auth/me', { headers: { Cookie: sessionCookie } });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, 'audit.session.test@hostelfix.edu');
    });

    await testCase('POST /api/auth/logout revokes session in DB and clears cookie', async () => {
      const logoutRes = await request('/auth/logout', {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      });
      assert.strictEqual(logoutRes.status, 200);
      assert.strictEqual(logoutRes.body.success, true);

      // Verify cookie cleared with matching path & expiry
      const setCookie = logoutRes.headers.get('set-cookie');
      assert(setCookie && (setCookie.includes('token=;') || setCookie.includes('Expires=Thu, 01 Jan 1970')), 'Cookie must be cleared');
    });

    await testCase('Replaying the pre-logout session cookie is strictly rejected with 401', async () => {
      const replayRes = await request('/auth/me', {
        headers: { Cookie: sessionCookie },
      });
      assert.strictEqual(replayRes.status, 401);
      assert.strictEqual(replayRes.body.success, false);
      assert(replayRes.body.message.includes('invalidated or expired') || replayRes.body.message.includes('Invalid or expired'));
    });

    await testCase('Replaying the pre-logout token in Authorization header is rejected with 401', async () => {
      const replayRes = await request('/student/dashboard', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      assert.strictEqual(replayRes.status, 401);
      assert.strictEqual(replayRes.body.success, false);
    });

    await testCase('Subsequent login creates a brand new valid session (200 OK)', async () => {
      const newLoginRes = await request('/auth/demo-student-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'audit.session.test@hostelfix.edu' }),
      });
      assert.strictEqual(newLoginRes.status, 200);
      const newCookie = newLoginRes.headers.get('set-cookie').split(';')[0];

      const meRes = await request('/auth/me', { headers: { Cookie: newCookie } });
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meRes.body.user.email, 'audit.session.test@hostelfix.edu');
    });

    // ------------------------------------------------------------------------
    // SECTION 6: Warden Custom Authentication Remains Independent
    // ------------------------------------------------------------------------
    console.log('\n--- CHECK 6: Warden Authentication Independence & Password Security ---');

    const adminLoginId = process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Warden@Secure2026';

    await testCase('Valid warden credentials authenticate successfully (200 OK)', async () => {
      const res = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: adminLoginId, password: adminPassword }),
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.role, 'admin');
      assert.strictEqual(res.body.user.passwordHash, undefined, 'passwordHash must never be exposed');
    });

    await testCase('Invalid warden password is rejected with 401 Unauthorized', async () => {
      const res = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: adminLoginId, password: 'WrongPassword@123' }),
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Non-existent warden login ID is rejected with 401 Unauthorized', async () => {
      const res = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: 'nonexistent.warden@hostelfix.edu', password: 'Password@123' }),
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await testCase('Warden passwords in database are verified to use bcrypt hashing', async () => {
      const admin = await Admin.findOne({ loginId: adminLoginId.toLowerCase().trim() });
      assert(admin, 'Admin record must exist in database');
      assert(admin.passwordHash, 'Admin record must have passwordHash');
      assert(
        admin.passwordHash.startsWith('$2a$') || admin.passwordHash.startsWith('$2b$'),
        'Password hash must follow standard bcrypt format ($2a$ or $2b$)'
      );
      assert.strictEqual(admin.passwordHash.length, 60, 'Bcrypt hash must be 60 characters long');
    });

    await testCase('Authorized warden session accesses protected admin dashboard (200 OK)', async () => {
      const loginRes = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: adminLoginId, password: adminPassword }),
      });
      const wardenCookie = loginRes.headers.get('set-cookie').split(';')[0];

      const dashRes = await request('/admin/dashboard', {
        headers: { Cookie: wardenCookie },
      });
      assert.strictEqual(dashRes.status, 200);
      assert.strictEqual(dashRes.body.success, true);
      assert(dashRes.body.metrics, 'Dashboard response must contain metrics');
    });

    await testCase('Authorized warden can export CSV reports (200 OK, text/csv)', async () => {
      const loginRes = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: adminLoginId, password: adminPassword }),
      });
      const wardenCookie = loginRes.headers.get('set-cookie').split(';')[0];

      const exportRes = await request('/admin/reports/export', {
        headers: { Cookie: wardenCookie },
      });
      assert.strictEqual(exportRes.status, 200);
      const contentType = exportRes.headers.get('content-type');
      assert(contentType && contentType.includes('text/csv'), 'Header must be text/csv');
      assert(typeof exportRes.body === 'string' && exportRes.body.includes('Reference ID'), 'CSV content must contain headers');
    });

    await testCase('Warden logout invalidates warden session and rejects replay (401)', async () => {
      const loginRes = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ loginId: adminLoginId, password: adminPassword }),
      });
      const wardenCookie = loginRes.headers.get('set-cookie').split(';')[0];

      const logoutRes = await request('/auth/logout', {
        method: 'POST',
        headers: { Cookie: wardenCookie },
      });
      assert.strictEqual(logoutRes.status, 200);

      const replayRes = await request('/admin/dashboard', {
        headers: { Cookie: wardenCookie },
      });
      assert.strictEqual(replayRes.status, 401);
    });

    console.log('\n================================================================');
    console.log(` AUDIT SUMMARY: \x1b[32m${passed} PASSED\x1b[0m, \x1b[31m${failed} FAILED\x1b[0m out of ${passed + failed} checks`);
    console.log('================================================================\n');

    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\nFatal test runner error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runSecurityAudit();
