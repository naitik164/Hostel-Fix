const assert = require('assert');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING GOOGLE AUTH & SECURITY VERIFICATION SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  // Helper for requests
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

  // TEST 1: Missing Google Credential
  try {
    process.stdout.write('Test 1: POST /api/auth/google with missing credential... ');
    const res = await request('/auth/google', { method: 'POST', body: JSON.stringify({}) });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    console.log('PASSED (Returned 400 Bad Request)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 2: Invalid / Malformed Google ID Token
  try {
    process.stdout.write('Test 2: POST /api/auth/google with forged/invalid token... ');
    const res = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: 'forged.fake.token.12345' }),
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    console.log('PASSED (Returned 401 Verification Failed)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 3: Unauthenticated GET /api/auth/me
  try {
    process.stdout.write('Test 3: GET /api/auth/me without active session... ');
    const res = await request('/auth/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    console.log('PASSED (Returned 401 Unauthorized)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 4: Student Authentication & Session Cookie
  let studentCookie = '';
  let studentToken = '';
  try {
    process.stdout.write('Test 4: Student login establishes session & HttpOnly cookie... ');
    const res = await request('/auth/demo-student-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'aarav.sharma@hostelfix.edu' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'student');

    // Extract Set-Cookie
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('token='), 'HttpOnly token cookie must be present');
    studentCookie = setCookie.split(';')[0];
    studentToken = res.body.token;
    console.log('PASSED (HttpOnly cookie set, role=student)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message, e.cause || '');
    failed++;
  }

  // TEST 5: Session Restoration via GET /api/auth/me using Cookie
  try {
    process.stdout.write('Test 5: Restore session via GET /api/auth/me with Cookie... ');
    const res = await request('/auth/me', {
      headers: { Cookie: studentCookie },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.email, 'aarav.sharma@hostelfix.edu');
    assert.strictEqual(res.body.user.role, 'student');
    console.log('PASSED (Session restored from cookie)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 6: Student Authorization - Attempt to Access Admin Route
  try {
    process.stdout.write('Test 6: Student attempts unauthorized access to /api/admin/dashboard... ');
    const res = await request('/admin/dashboard', {
      headers: { Cookie: studentCookie },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    console.log('PASSED (Rejected with 403 Forbidden)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 7: Student attempts to access another student's complaint
  try {
    process.stdout.write('Test 7: Student A attempts to access Student B complaint... ');
    // Student B login
    const studentBRes = await request('/auth/demo-student-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'priya.patel@hostelfix.edu', name: 'Priya Patel' }),
    });
    const cookieB = studentBRes.headers.get('set-cookie').split(';')[0];

    // Student B creates a complaint
    const createRes = await request('/student/complaints', {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: JSON.stringify({
        title: 'Confidential personal issue in Room E-201',
        category: 'Cleanliness & Hygiene',
        description: 'Private student complaint',
        hostelBlockName: 'Sarojini Naidu Hall',
        roomNumber: 'E-201',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const complaintId = createRes.body.complaint._id;

    // Student A tries to read Student B's complaint
    const attackRes = await request(`/student/complaints/${complaintId}`, {
      headers: { Cookie: studentCookie },
    });
    assert.strictEqual(attackRes.status, 403);
    assert.strictEqual(attackRes.body.success, false);
    console.log('PASSED (Rejected with 403 Ownership Protection)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 8: Warden Authentication & Admin Route Access
  let wardenCookie = '';
  try {
    process.stdout.write('Test 8: Warden login and /api/admin/dashboard access... ');
    const res = await request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        loginId: process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu',
        password: process.env.ADMIN_PASSWORD || 'Warden@Secure2026',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'admin');

    wardenCookie = res.headers.get('set-cookie').split(';')[0];

    const dashRes = await request('/admin/dashboard', {
      headers: { Cookie: wardenCookie },
    });
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(dashRes.body.success, true);
    console.log('PASSED (Warden authorized, metrics returned)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  // TEST 9: Logout Invalidation
  try {
    process.stdout.write('Test 9: POST /api/auth/logout invalidates session... ');
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: studentCookie },
    });
    assert.strictEqual(logoutRes.status, 200);

    const clearedCookie = logoutRes.headers.get('set-cookie');
    assert(clearedCookie && (clearedCookie.includes('token=;') || clearedCookie.includes('Max-Age=0') || clearedCookie.includes('Expires=Thu, 01 Jan 1970')), 'Cookie must be cleared');

    // Verify GET /api/auth/me with cleared cookie returns 401
    const postLogoutRes = await request('/auth/me', {
      headers: { Cookie: 'token=' },
    });
    assert.strictEqual(postLogoutRes.status, 401);
    console.log('PASSED (Session successfully cleared and invalidated)');
    passed++;
  } catch (e) {
    console.log('FAILED:', e.message);
    failed++;
  }

  console.log('====================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
