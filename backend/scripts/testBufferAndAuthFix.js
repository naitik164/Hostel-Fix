/**
 * Comprehensive Test Suite for HostelFix Server Startup & Database Architecture
 * Verifies non-blocking port binding, structured health check specifications, 503 guard, and student auth isolation.
 */

const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, isDatabaseReady, getDatabaseStatus } = require('../src/config/db');
const app = require('../src/app');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] Test ${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log(' HOSTELFIX SERVER STARTUP & RELIABILITY TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Server binds HTTP port promptly (in < 3000ms) without waiting on MongoDB Atlas
  console.log('--- Step 1: Testing prompt HTTP port binding ---');
  const tStart = Date.now();
  let serverProcess = null;
  const testPort = 5992;

  await new Promise((resolve) => {
    serverProcess = spawn('node', ['src/server.js'], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        PORT: testPort.toString(),
      },
    });

    const checkInterval = setInterval(() => {
      http.get(`http://127.0.0.1:${testPort}/api/health`, (res) => {
        clearInterval(checkInterval);
        const elapsed = Date.now() - tStart;
        assert(
          elapsed < 3500,
          `HTTP server bound port ${testPort} and /api/health responded in ${elapsed}ms (< 3500ms)`
        );
        resolve();
      }).on('error', () => {
        if (Date.now() - tStart > 5000) {
          clearInterval(checkInterval);
          assert(false, 'HTTP server failed to bind port within 5000ms');
          resolve();
        }
      });
    }, 100);
  });

  // Test 2: Structured Health Check Endpoint specification when DB is disconnected
  console.log('\n--- Step 2: Testing Structured /api/health endpoint when DB is disconnected ---');
  await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${testPort}/api/health`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        assert(res.statusCode === 503, `Disconnected /api/health returns HTTP 503 (Got: ${res.statusCode})`);
        const json = JSON.parse(body);
        assert(json.success === false, 'json.success is false when disconnected');
        assert(json.server === 'online', 'json.server is "online"');
        assert(json.database === 'disconnected', 'json.database is "disconnected"');
        assert(!body.includes('mongodb+srv://') && !body.includes('password'), 'Zero credentials leaked in health check');
        resolve();
      });
    });
  });

  // Test 3: Database-dependent routes return immediate HTTP 503 while database is disconnected
  console.log('\n--- Step 3: Testing database route guard while DB is disconnected ---');
  await new Promise((resolve) => {
    const postData = JSON.stringify({ credential: 'test_token' });
    const req = http.request(`http://127.0.0.1:${testPort}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        assert(
          res.statusCode === 503,
          `Database route returns HTTP 503 while DB is disconnected (Got: ${res.statusCode})`
        );
        const json = JSON.parse(body);
        assert(
          json.message.includes('Database service is temporarily unavailable'),
          'Clean 503 message without exposing internal MongoDB errors'
        );
        resolve();
      });
    });
    req.write(postData);
    req.end();
  });

  // Test 4: Readiness check endpoint (/api/health/ready) reports 503 when disconnected
  console.log('\n--- Step 4: Testing Readiness check (/api/health/ready) ---');
  await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${testPort}/api/health/ready`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        assert(
          res.statusCode === 503,
          `Readiness endpoint accurately reports HTTP 503 when database is not connected (Got: ${res.statusCode})`
        );
        resolve();
      });
    });
  });

  // Test 5: Graceful shutdown on SIGTERM
  console.log('\n--- Step 5: Testing graceful shutdown on SIGTERM ---');
  await new Promise((resolve) => {
    serverProcess.on('close', (code, signal) => {
      assert(
        code === 0 || signal === 'SIGTERM',
        `Server process exited cleanly on SIGTERM (code: ${code}, signal: ${signal})`
      );
      resolve();
    });
    serverProcess.kill('SIGTERM');
  });

  // Test 6: Verify Student Login does NOT call Admin.findOne()
  console.log('\n--- Step 6: Codebase Audit: Verify Student Login isolation ---');
  const authControllerSrc = require('fs').readFileSync(
    path.join(__dirname, '../src/controllers/authController.js'),
    'utf8'
  );
  const googleLoginMatch = authControllerSrc.match(/const googleLogin = async \(req, res, next\) => \{([\s\S]*?)\n\};/);
  const googleLoginBody = googleLoginMatch ? googleLoginMatch[1] : '';
  assert(
    !googleLoginBody.includes('Admin.findOne'),
    'Student googleLogin does NOT call Admin.findOne() anywhere in its execution path'
  );
  assert(
    googleLoginBody.includes('User.findOne'),
    'Student googleLogin queries the Student User model directly'
  );

  // Test 7: Verify global bufferCommands = false
  console.log('\n--- Step 7: Verifying bufferCommands configuration ---');
  assert(
    mongoose.get('bufferCommands') === false,
    'Mongoose global bufferCommands is set to false (prevents 10s buffering hangs)'
  );

  // Test 8: Frontend getApiBaseUrl utility logic
  console.log('\n--- Step 8: Verifying Frontend API Base URL resolution ---');
  const apiClientSrc = require('fs').readFileSync(
    path.join(__dirname, '../../frontend/src/services/api/apiClient.js'),
    'utf8'
  );
  assert(
    apiClientSrc.includes('getApiBaseUrl'),
    'Frontend apiClient uses getApiBaseUrl() to normalize development and production URLs'
  );
  assert(
    apiClientSrc.includes('endsWith(\'/api\')'),
    'getApiBaseUrl prevents duplicate /api/api path segments'
  );

  console.log('\n================================================================');
  console.log(` RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
