/**
 * Comprehensive Test Suite for HostelFix MongoDB Buffering & Auth Architecture
 * Verifies all 11 requirements from the issue report.
 */

const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Admin = require('../src/models/Admin');
const Staff = require('../src/models/Staff');
const Session = require('../src/models/Session');
const { generateToken } = require('../src/utils/jwt');

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
  console.log(' HOSTELFIX MONGODB BUFFERING & AUTHENTICATION VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: Backend startup with missing MONGODB_URI
  console.log('--- Step 1: Testing server startup with missing MONGODB_URI ---');
  await new Promise((resolve) => {
    const proc = spawn('node', ['src/server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, MONGODB_URI: '' },
    });
    let output = '';
    proc.stderr.on('data', (d) => (output += d.toString()));
    proc.stdout.on('data', (d) => (output += d.toString()));
    proc.on('close', (code) => {
      assert(
        code === 1 && output.includes('MONGODB_URI is not defined'),
        'Server aborts startup (code 1) when MONGODB_URI is missing'
      );
      resolve();
    });
  });

  // Test 2: Backend startup when MongoDB Atlas is unreachable (Fast-fail check)
  console.log('\n--- Step 2: Testing server startup when MongoDB Atlas is unreachable ---');
  const tStartUnreachable = Date.now();
  await new Promise((resolve) => {
    const proc = spawn('node', ['src/server.js'], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        MONGODB_URI: 'mongodb://127.0.0.1:27099/hostelfix?serverSelectionTimeoutMS=1000',
      },
    });
    let output = '';
    proc.stderr.on('data', (d) => (output += d.toString()));
    proc.stdout.on('data', (d) => (output += d.toString()));
    proc.on('close', (code) => {
      const elapsed = Date.now() - tStartUnreachable;
      assert(
        code === 1 && elapsed < 8000,
        `Server aborts startup promptly (${elapsed}ms < 8s) when MongoDB is unreachable instead of hanging`
      );
      assert(
        output.includes('Database connection failed'),
        'Server outputs clear diagnostic logs detailing failure causes'
      );
      resolve();
    });
  });

  // Test 3: Disconnected Request Guard (Immediate HTTP 503 instead of 10s buffering timeout)
  console.log('\n--- Step 3: Testing API behavior while MongoDB is disconnected ---');
  const tStartDisc = Date.now();
  // Ensure mongoose is disconnected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const http = require('http');
  const testServer = http.createServer(app);
  await new Promise((res) => testServer.listen(0, '127.0.0.1', res));
  const testPort = testServer.address().port;

  // Attempt Student Login while disconnected
  await new Promise((resolve) => {
    const postData = JSON.stringify({ credential: 'dummy_token' });
    const req = http.request(
      `http://127.0.0.1:${testPort}/api/auth/google`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c.toString()));
        res.on('end', () => {
          const elapsed = Date.now() - tStartDisc;
          const json = JSON.parse(body);
          assert(
            res.statusCode === 503,
            `Disconnected Student Login immediately returns HTTP 503 (Got: ${res.statusCode})`
          );
          assert(
            elapsed < 1000,
            `Response returned immediately in ${elapsed}ms (No 10,000ms buffering timeout!)`
          );
          assert(
            json.message.includes('Database service is temporarily unavailable'),
            'Clean user-facing 503 message without internal Mongoose error or credentials'
          );
          resolve();
        });
      }
    );
    req.write(postData);
    req.end();
  });

  // Test 4: Liveness endpoint (/api/health) remains responsive even when DB is disconnected
  console.log('\n--- Step 4: Testing Liveness endpoint (/api/health) ---');
  await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${testPort}/api/health`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c.toString()));
      res.on('end', () => {
        assert(res.statusCode === 200, `Liveness /api/health returns HTTP 200 (Got: ${res.statusCode})`);
        resolve();
      });
    });
  });

  // Test 5: Readiness endpoint (/api/health/ready) returns HTTP 503 when DB is disconnected
  console.log('\n--- Step 5: Testing Readiness endpoint (/api/health/ready) while disconnected ---');
  await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${testPort}/api/health/ready`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c.toString()));
      res.on('end', () => {
        assert(res.statusCode === 503, `Readiness /api/health/ready returns HTTP 503 when disconnected (Got: ${res.statusCode})`);
        resolve();
      });
    });
  });

  // Test 6: Verify Student Login flow codebase does NOT reference Admin.findOne()
  console.log('\n--- Step 6: Verifying Student Login does not execute Admin.findOne() ---');
  const authControllerSrc = require('fs').readFileSync(
    path.join(__dirname, '../src/controllers/authController.js'),
    'utf8'
  );
  
  // Extract googleLogin function body
  const googleLoginMatch = authControllerSrc.match(/const googleLogin = async \(req, res, next\) => \{([\s\S]*?)\n\};/);
  const googleLoginBody = googleLoginMatch ? googleLoginMatch[1] : '';
  
  assert(
    !googleLoginBody.includes('Admin.findOne'),
    'Student googleLogin does NOT call Admin.findOne() anywhere in its execution path'
  );
  assert(
    !googleLoginBody.includes('adminCollision'),
    'Removed inappropriate admin collision check from Student Login'
  );
  assert(
    googleLoginBody.includes('User.findOne'),
    'Student googleLogin queries the Student User model directly'
  );

  // Test 7: Verify Mongoose bufferCommands = false
  console.log('\n--- Step 7: Verifying global bufferCommands configuration ---');
  assert(
    mongoose.get('bufferCommands') === false,
    'Mongoose global bufferCommands is set to false (prevents 10s buffering hangs)'
  );

  // Test 8: Verify Error Handler catches any potential Mongoose buffering / connection error as 503
  console.log('\n--- Step 8: Testing error handling middleware for database errors ---');
  const errorHandler = require('../src/middleware/errorHandler');
  const mockReq = {};
  let capturedStatus = 0;
  let capturedJson = null;
  const mockRes = {
    status(s) {
      capturedStatus = s;
      return this;
    },
    json(j) {
      capturedJson = j;
      return this;
    },
  };

  const bufferError = new Error('Operation `admins.findOne()` buffering timed out after 10000ms');
  bufferError.name = 'MongooseError';
  errorHandler(bufferError, mockReq, mockRes, () => {});

  assert(
    capturedStatus === 503,
    `Error handler converts Mongoose buffering error to HTTP 503 (Got: ${capturedStatus})`
  );
  assert(
    capturedJson && capturedJson.message.includes('Database service is temporarily unavailable'),
    'Error handler returns safe, generic message without leaking MongoDB internals'
  );

  // Test 9: Server startup file validation
  console.log('\n--- Step 9: Verifying server.js startup architecture ---');
  const serverSrc = require('fs').readFileSync(
    path.join(__dirname, '../src/server.js'),
    'utf8'
  );
  assert(
    serverSrc.indexOf('await connectDB()') < serverSrc.indexOf('app.listen('),
    'server.js awaits connectDB() BEFORE calling app.listen()'
  );
  assert(
    serverSrc.includes('SIGTERM') && serverSrc.includes('SIGINT'),
    'server.js handles SIGTERM and SIGINT graceful shutdown'
  );

  testServer.close();

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
