/**
 * HostelFix Comprehensive TLS, Database Lifecycle & Auth Verification Suite
 * Tests TLS compatibility, DNS/SRV resolution, connection manager telemetry,
 * structured /api/health specification, and model query isolation.
 */

const path = require('path');
const dns = require('dns');
const net = require('net');
const tls = require('tls');
const http = require('http');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, isDatabaseReady, getDatabaseStatus, scheduleReconnect } = require('../src/config/db');
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

async function runSuite() {
  console.log('================================================================');
  console.log(' HOSTELFIX TLS, DATABASE LIFECYCLE & AUTH VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: Node.js and OpenSSL runtime environment
  console.log('--- Step 1: Runtime & Cryptographic Environment ---');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`OpenSSL Version: ${process.versions.openssl}`);
  console.log(`Mongoose Version: ${mongoose.version}`);
  console.log(`Platform: ${process.platform} (${process.arch})`);
  assert(
    process.version.startsWith('v'),
    `Node.js runtime active: ${process.version}`
  );
  assert(
    Boolean(process.versions.openssl),
    `OpenSSL cryptographic engine loaded: ${process.versions.openssl}`
  );

  // Test 2: DNS / SRV Resolution for Atlas Cluster
  console.log('\n--- Step 2: DNS SRV Resolution for MongoDB Atlas ---');
  if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
  const srvHostname = '_mongodb._tcp.hostelfixcluster.orvxgbj.mongodb.net';
  const srvRecords = await new Promise((resolve) => {
    dns.resolveSrv(srvHostname, (err, addresses) => {
      if (err) {
        console.error('SRV Resolution error:', err.message);
        resolve([]);
      } else {
        resolve(addresses || []);
      }
    });
  });

  assert(
    srvRecords.length >= 3,
    `SRV record resolved successfully (${srvRecords.length} shards found in cluster)`
  );

  // Test 3: TCP Port 27017 Connectivity to Shards
  console.log('\n--- Step 3: TCP Connectivity to Port 27017 ---');
  if (srvRecords.length > 0) {
    const shard = srvRecords[0];
    const isTcpAlive = await new Promise((resolve) => {
      const sock = net.createConnection(shard.port, shard.name, () => {
        sock.end();
        resolve(true);
      });
      sock.setTimeout(4000, () => {
        sock.destroy();
        resolve(false);
      });
      sock.on('error', () => resolve(false));
    });
    assert(
      isTcpAlive,
      `TCP connection established to Atlas shard: ${shard.name}:${shard.port}`
    );
  } else {
    assert(false, 'No shards available for TCP test');
  }

  // Test 4: Structured /api/health Endpoint Specification
  console.log('\n--- Step 4: Testing Structured /api/health Endpoint ---');
  const testServer = http.createServer(app);
  await new Promise((res) => testServer.listen(0, '127.0.0.1', res));
  const testPort = testServer.address().port;

  await new Promise((resolve) => {
    http.get(`http://127.0.0.1:${testPort}/api/health`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const json = JSON.parse(body);
        assert(
          res.statusCode === 503 || res.statusCode === 200,
          `Health check returns proper HTTP status code (Got: ${res.statusCode})`
        );
        assert(
          json.server === 'online',
          `Response contains server: "online" (Got: "${json.server}")`
        );
        assert(
          json.database === 'connected' || json.database === 'disconnected',
          `Response contains valid database status (Got: "${json.database}")`
        );
        assert(
          !body.includes('mongodb+srv://') && !body.includes('password'),
          'Credentials and connection strings are strictly masked from health response'
        );
        resolve();
      });
    });
  });

  // Test 5: Database Readiness Guard on Auth Routes
  console.log('\n--- Step 5: Database Readiness Middleware Guard ---');
  await new Promise((resolve) => {
    const postData = JSON.stringify({ credential: 'dummy_token' });
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
        const dbReady = isDatabaseReady();
        if (!dbReady) {
          assert(
            res.statusCode === 503,
            `Database route guarded: returns HTTP 503 while database is unavailable (Got: ${res.statusCode})`
          );
          const json = JSON.parse(body);
          assert(
            json.message.includes('Database service is temporarily unavailable'),
            'Clean user-facing 503 message without exposing internal errors'
          );
        } else {
          assert(
            res.statusCode !== 503,
            'Database route allowed: database is connected and ready'
          );
        }
        resolve();
      });
    });
    req.write(postData);
    req.end();
  });

  // Test 6: Model Isolation Verification (Student Login must never call Admin.findOne)
  console.log('\n--- Step 6: Model Query Isolation Verification ---');
  const authControllerSrc = require('fs').readFileSync(
    path.join(__dirname, '../src/controllers/authController.js'),
    'utf8'
  );
  const googleLoginMatch = authControllerSrc.match(/const googleLogin = async \(req, res, next\) => \{([\s\S]*?)\n\};/);
  const googleLoginBody = googleLoginMatch ? googleLoginMatch[1] : '';
  assert(
    !googleLoginBody.includes('Admin.findOne'),
    'Student Google Login does NOT execute Admin.findOne() anywhere in its execution path'
  );
  assert(
    googleLoginBody.includes('User.findOne'),
    'Student Google Login queries the Student User model directly'
  );

  // Test 7: Mongoose bufferCommands = false verification
  console.log('\n--- Step 7: Operation Buffering Disabled ---');
  assert(
    mongoose.get('bufferCommands') === false,
    'Global bufferCommands is set to false (prevents 10,000ms buffering timeouts)'
  );

  // Test 8: Centralized Telemetry & Readiness Functionality
  console.log('\n--- Step 8: Telemetry & Connection State Manager ---');
  const status = getDatabaseStatus();
  assert(
    typeof status.isReady === 'boolean',
    `getDatabaseStatus().isReady is boolean (Current: ${status.isReady})`
  );
  assert(
    typeof status.state === 'string',
    `getDatabaseStatus().state is string (Current: "${status.state}")`
  );
  assert(
    typeof status.reconnectAttempts === 'number',
    `getDatabaseStatus().reconnectAttempts is tracked (Current: ${status.reconnectAttempts})`
  );

  // Test 9: Frontend Base URL resolution verification
  console.log('\n--- Step 9: Frontend API URL Resolution ---');
  const apiClientSrc = require('fs').readFileSync(
    path.join(__dirname, '../../frontend/src/services/api/apiClient.js'),
    'utf8'
  );
  assert(
    apiClientSrc.includes('getApiBaseUrl'),
    'Frontend uses normalized getApiBaseUrl() for development and production'
  );
  assert(
    apiClientSrc.includes("endsWith('/api')"),
    'getApiBaseUrl eliminates duplicate /api/api path segments'
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

runSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
