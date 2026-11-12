const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000';

async function runVerification() {
  console.log('================================================================');
  console.log(' HOSTELFIX — ALL 3 AUTHENTICATION SYSTEMS PRODUCTION VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, durationMs, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName} (${durationMs.toFixed(1)}ms) ${details ? '— ' + details : ''}`);
    } else {
      console.error(`[FAIL] ${testName} (${durationMs.toFixed(1)}ms) — ${details}`);
    }
  }

  // TEST 1: Lightweight Liveness Health Check (/api/health)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    const d = performance.now() - t0;
    assert(res.status === 200 && data.status === 'ok' && data.success, 'Lightweight Liveness Endpoint (/api/health)', d, `Status: ${data.status}`);
  } catch (err) {
    assert(false, 'Lightweight Liveness Endpoint (/api/health)', 0, err.message);
  }

  // TEST 1b: Database Readiness Health Check (/api/health/ready)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/health/ready`);
    const data = await res.json();
    const d = performance.now() - t0;
    assert(res.status === 200 && data.status === 'ready' && data.database === 'connected', 'Database Readiness Endpoint (/api/health/ready)', d, `DB Status: ${data.database}`);
  } catch (err) {
    assert(false, 'Database Readiness Endpoint (/api/health/ready)', 0, err.message);
  }

  // TEST 2: Warden ID & Password Authentication
  let wardenToken = null;
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu',
        password: process.env.ADMIN_PASSWORD || 'Warden@Secure2026',
      }),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    wardenToken = data.token;
    assert(
      res.status === 200 && data.success && data.user && data.user.role === 'admin' && wardenToken,
      'Warden ID & Password Authentication',
      d,
      `User: ${data.user?.name} (${data.user?.email})`
    );
  } catch (err) {
    assert(false, 'Warden ID & Password Authentication', 0, err.message);
  }

  // TEST 3: Warden Session & Protected Route Verification (/api/auth/me)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${wardenToken}`,
      },
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 200 && data.success && data.user && data.user.role === 'admin',
      'Warden Session /api/auth/me Verification',
      d,
      `Role: ${data.user?.role}`
    );
  } catch (err) {
    assert(false, 'Warden Session /api/auth/me Verification', 0, err.message);
  }

  // TEST 4: Student Google Login Validation (Missing credential handling)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 400 && data.success === false,
      'Student Google Login Validation (Missing Body)',
      d,
      data.message
    );
  } catch (err) {
    assert(false, 'Student Google Login Validation (Missing Body)', 0, err.message);
  }

  // TEST 5: Student Google Login Token Verification (Invalid token handling)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid_dummy_google_jwt_token' }),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 401 && data.success === false,
      'Student Google Token Security Verification (Invalid Token Rejection)',
      d,
      data.message
    );
  } catch (err) {
    assert(false, 'Student Google Token Security Verification', 0, err.message);
  }

  // TEST 6: Staff Google Login Validation (Missing credential handling)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/staff/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 400 && data.success === false,
      'Staff Google Login Validation (Missing Body)',
      d,
      data.message
    );
  } catch (err) {
    assert(false, 'Staff Google Login Validation (Missing Body)', 0, err.message);
  }

  // TEST 7: Staff Google Login Token Verification (Invalid token handling)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/staff/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid_dummy_google_jwt_token' }),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 401 && data.success === false,
      'Staff Google Token Security Verification (Invalid Token Rejection)',
      d,
      data.message
    );
  } catch (err) {
    assert(false, 'Staff Google Token Security Verification', 0, err.message);
  }

  // TEST 8: Student Authentication & Session Persistence (Simulated flow)
  let studentToken = null;
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/demo-student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aarav.sharma@hostelfix.edu' }),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    studentToken = data.token;
    assert(
      res.status === 200 && data.success && data.user && data.user.role === 'student' && studentToken,
      'Student Authentication Flow',
      d,
      `Student: ${data.user?.name} (${data.user?.email})`
    );
  } catch (err) {
    assert(false, 'Student Authentication Flow', 0, err.message);
  }

  // TEST 9: Student Protected Route Access (/api/auth/me)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
      },
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 200 && data.success && data.user && data.user.role === 'student',
      'Student Session /api/auth/me Verification',
      d,
      `Role: ${data.user?.role}`
    );
  } catch (err) {
    assert(false, 'Student Session /api/auth/me Verification', 0, err.message);
  }

  // TEST 10: Staff Registration & Authentication Flow
  let staffToken = null;
  const staffTestEmail = `technician.verified.${Date.now()}@hostelfix.edu`;
  try {
    // 1. Register staff via Warden Portal
    const regRes = await fetch(`${BASE_URL}/api/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wardenToken}`,
      },
      body: JSON.stringify({
        name: 'Kailash Verma',
        employeeId: `EMP-${Date.now().toString().slice(-4)}`,
        email: staffTestEmail,
        specialization: 'Electrical',
        department: 'Electrical Maintenance',
        assignedBlocks: ['BLOCK-A', 'BLOCK-B'],
        phone: '+91 98765 11223',
      }),
    });
    const regData = await regRes.json();

    // 2. Authenticate as the newly registered staff member
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/demo-staff-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffTestEmail }),
    });
    const d = performance.now() - t0;
    const data = await res.json();
    staffToken = data.token;
    assert(
      res.status === 200 && data.success && data.user && data.user.role === 'staff' && staffToken,
      'Staff Registration & Authentication Flow',
      d,
      `Staff: ${data.user?.name} (${data.user?.email})`
    );
  } catch (err) {
    assert(false, 'Staff Registration & Authentication Flow', 0, err.message);
  }

  // TEST 11: Staff Protected Route Access (/api/auth/me)
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${staffToken}`,
      },
    });
    const d = performance.now() - t0;
    const data = await res.json();
    assert(
      res.status === 200 && data.success && data.user && data.user.role === 'staff',
      'Staff Session /api/auth/me Verification',
      d,
      `Role: ${data.user?.role}`
    );
  } catch (err) {
    assert(false, 'Staff Session /api/auth/me Verification', 0, err.message);
  }

  console.log('\n================================================================');
  console.log(` RESULT: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
