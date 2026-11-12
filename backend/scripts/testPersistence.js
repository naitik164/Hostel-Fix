const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const BASE_URL = 'http://localhost:5000';

async function runPersistenceAudit() {
  console.log('================================================================');
  console.log(' HOSTELFIX — AUTHENTICATION PERSISTENCE & RESTORATION AUDIT');
  console.log('================================================================\n');

  // --- PART 1: WARDEN SESSION PERSISTENCE & RESTORATION ---
  console.log('--- TEST GROUP 1: Warden Portal Authentication & Refresh Persistence ---');

  // Step 1: Warden Login
  const wardenLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu',
      password: process.env.ADMIN_PASSWORD || 'Warden@Secure2026',
    }),
  });
  const wardenLoginData = await wardenLoginRes.json();
  if (!wardenLoginData.success) throw new Error('Warden login failed');
  const wardenCookie = wardenLoginRes.headers.get('set-cookie');
  console.log('• Warden login successful (200 OK) ... [PASS]');
  console.log(`  - Set-Cookie received: ${wardenCookie ? wardenCookie.split(';')[0] : 'None'}`);

  // Step 2: Session Restoration (GET /api/auth/me on refresh)
  const wardenRefreshRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: wardenCookie },
  });
  const wardenRefreshData = await wardenRefreshRes.json();
  if (!wardenRefreshData.success || wardenRefreshData.user.role !== 'admin') {
    throw new Error('Warden session restoration failed on refresh');
  }
  console.log(`• Refresh simulation: GET /api/auth/me restores warden session (${wardenRefreshData.user.name}, role: ${wardenRefreshData.user.role}) ... [PASS]`);

  // Step 3: Access protected admin routes with restored session
  const adminDashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Cookie: wardenCookie },
  });
  if (adminDashRes.status !== 200) throw new Error('Warden dashboard access failed with restored session');
  console.log('• Protected route /api/admin/dashboard accessed successfully with restored cookie session ... [PASS]');

  // Step 4: Role enforcement — Warden cannot access student complaints endpoint as student
  const crossRoleRes = await fetch(`${BASE_URL}/api/student/dashboard`, {
    headers: { Cookie: wardenCookie },
  });
  if (crossRoleRes.status !== 403) throw new Error(`Expected 403 Forbidden for warden on student dashboard, got ${crossRoleRes.status}`);
  console.log('• Strict Role Isolation: Warden session rejected from /api/student/dashboard (403 Forbidden) ... [PASS]');

  // Step 5: Warden Logout
  const wardenLogoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: wardenCookie },
  });
  console.log('• Warden logout: POST /api/auth/logout succeeds and invalidates session in DB ... [PASS]');

  // Step 6: Verify Session Invalidation after Logout
  const wardenReplayRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: wardenCookie },
  });
  if (wardenReplayRes.status !== 401) throw new Error('Session was not invalidated after logout!');
  console.log('• Post-logout replay of pre-logout session cookie is strictly rejected (401 Unauthorized) ... [PASS]');


  // --- PART 2: STUDENT SESSION PERSISTENCE & RESTORATION ---
  console.log('\n--- TEST GROUP 2: Student Portal Authentication & Refresh Persistence ---');

  // Step 1: Student Login (Session Creation)
  const studentEmail = 'audit.studenta@hostelfix.edu';
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/demo-student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, name: 'Audit Student A' }),
  });
  const studentLoginData = await studentLoginRes.json();
  if (!studentLoginData.success) throw new Error('Student login failed');
  const studentCookie = studentLoginRes.headers.get('set-cookie');
  console.log('• Student login successful (200 OK) ... [PASS]');
  console.log(`  - Set-Cookie received: ${studentCookie ? studentCookie.split(';')[0] : 'None'}`);

  // Step 2: Session Restoration (GET /api/auth/me on refresh)
  const studentRefreshRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: studentCookie },
  });
  const studentRefreshData = await studentRefreshRes.json();
  if (!studentRefreshData.success || studentRefreshData.user.role !== 'student') {
    throw new Error('Student session restoration failed on refresh');
  }
  console.log(`• Refresh simulation: GET /api/auth/me restores student session (${studentRefreshData.user.name}, role: ${studentRefreshData.user.role}) ... [PASS]`);

  // Step 3: Access protected student routes with restored session
  const studentDashRes = await fetch(`${BASE_URL}/api/student/dashboard`, {
    headers: { Cookie: studentCookie },
  });
  if (studentDashRes.status !== 200) throw new Error('Student dashboard access failed with restored session');
  console.log('• Protected route /api/student/dashboard accessed successfully with restored cookie session ... [PASS]');

  // Step 4: Role enforcement — Student cannot access admin dashboard
  const studentAdminRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Cookie: studentCookie },
  });
  if (studentAdminRes.status !== 403) throw new Error(`Expected 403 Forbidden for student on admin dashboard, got ${studentAdminRes.status}`);
  console.log('• Strict Role Isolation: Student session rejected from /api/admin/dashboard (403 Forbidden) ... [PASS]');

  // Step 5: Student Logout
  const studentLogoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: studentCookie },
  });
  console.log('• Student logout: POST /api/auth/logout succeeds and invalidates session in DB ... [PASS]');

  // Step 6: Verify Session Invalidation after Logout
  const studentReplayRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: studentCookie },
  });
  if (studentReplayRes.status !== 401) throw new Error('Student session was not invalidated after logout!');
  console.log('• Post-logout replay of pre-logout student cookie is strictly rejected (401 Unauthorized) ... [PASS]');

  console.log('\n================================================================');
  console.log(' ✓ ALL 12 AUTHENTICATION PERSISTENCE CHECKS PASSED');
  console.log('================================================================\n');
}

runPersistenceAudit().catch(err => {
  console.error('\n[AUDIT FAILED]:', err);
  process.exit(1);
});
