/**
 * HostelFix MongoDB Atlas TLS & Environment Diagnostic Tool
 * Run: node backend/scripts/diagnoseAtlasTls.js
 */

const tls = require('tls');
const dns = require('dns');
const net = require('net');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const CLUSTER_HOST = 'ac-0zu7wyr-shard-00-00.orvxgbj.mongodb.net';
const SRV_RECORD = '_mongodb._tcp.hostelfixcluster.orvxgbj.mongodb.net';
const PORT = 27017;

const runDiagnostics = async () => {
  console.log('================================================================');
  console.log('       HOSTELFIX MONGODB ATLAS TLS & CONNECTIVITY AUDIT         ');
  console.log('================================================================\n');

  // 1. Runtime Versions
  console.log('--- 1. Runtime & Cryptographic Engine ---');
  console.log(`Node.js Version:        ${process.version}`);
  console.log(`OpenSSL Version:        ${process.versions.openssl}`);
  console.log(`V8 Version:             ${process.versions.v8}`);
  console.log(`Platform:               ${process.platform} (${process.arch})`);
  console.log(`Mongoose Version:       ${mongoose.version}`);
  console.log(`System Time:            ${new Date().toISOString()}`);

  // 2. Public IP & Network Route Check
  console.log('\n--- 2. Public IP & Geolocation ---');
  try {
    const ipData = await new Promise((resolve, reject) => {
      https.get('https://api.ipify.org?format=json', (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    console.log(`Outbound Public IP:     ${ipData.ip}`);
  } catch (err) {
    console.log(`Failed to fetch public IP: ${err.message}`);
  }

  // 3. DNS SRV Resolution
  console.log('\n--- 3. DNS SRV Resolution ---');
  await new Promise((resolve) => {
    dns.resolveSrv(SRV_RECORD, (err, addresses) => {
      if (err) {
        console.log(`[FAIL] SRV Resolution failed: ${err.message}`);
      } else {
        console.log(`[PASS] Resolved ${addresses.length} cluster shard hosts:`);
        addresses.forEach((addr, i) => console.log(`       Shard ${i}: ${addr.name}:${addr.port}`));
      }
      resolve();
    });
  });

  // 4. Raw TCP Socket Test to Port 27017
  console.log('\n--- 4. TCP Socket Connectivity (Port 27017) ---');
  await new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(4000);
    socket.connect(PORT, CLUSTER_HOST, () => {
      console.log(`[PASS] TCP 3-way handshake succeeded to ${CLUSTER_HOST}:${PORT}`);
      socket.destroy();
      resolve();
    });
    socket.on('error', (err) => {
      console.log(`[FAIL] TCP connection failed: ${err.message}`);
      resolve();
    });
    socket.on('timeout', () => {
      console.log('[FAIL] TCP connection timed out');
      socket.destroy();
      resolve();
    });
  });

  // 5. Raw TLS Handshake Test
  console.log('\n--- 5. TLS Handshake & Certificate Negotiation ---');
  await new Promise((resolve) => {
    const tlsSocket = tls.connect({
      host: CLUSTER_HOST,
      port: PORT,
      servername: CLUSTER_HOST,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }, () => {
      console.log('[PASS] TLS Handshake SUCCESSFUL!');
      console.log(`       Protocol:   ${tlsSocket.getProtocol()}`);
      console.log(`       Cipher:     ${tlsSocket.getCipher().name}`);
      console.log(`       Authorized: ${tlsSocket.authorized}`);
      tlsSocket.end();
      resolve();
    });

    tlsSocket.on('error', (err) => {
      console.log(`[FAIL] TLS Handshake failed: ${err.message}`);
      console.log(`       Error Code: ${err.code || 'N/A'}`);
      if (err.message.includes('alert number 80')) {
        console.log('\n[CRITICAL ROOT CAUSE DETECTED: TLS Alert 80]');
        console.log('MongoDB Atlas TLS proxy rejected the connection with Fatal Alert 80 (internal_error).');
        console.log('This occurs when:');
        console.log('1. The client outbound IP is NOT whitelisted in Atlas Network Access (IP Access List).');
        console.log('2. The MongoDB Atlas cluster is in a Paused/Inactive state.');
        console.log('3. An active VPN (e.g., HotspotShield) is intercepting or proxying port 27017 traffic.');
      }
      resolve();
    });
  });

  // 6. Direct Mongoose / Driver Connection
  console.log('\n--- 6. Mongoose Connection Execution ---');
  try {
    const { connectDB, getDatabaseStatus } = require('../src/config/db');
    await connectDB();
    const status = getDatabaseStatus();
    console.log(`[PASS] Mongoose Connected successfully!`);
    console.log(`       Database Host: ${status.host}`);
    console.log(`       Database Name: ${status.name}`);
    console.log(`       ReadyState:    ${status.readyState}`);
  } catch (err) {
    console.log(`[STATUS] Mongoose connection deferred: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log('                     AUDIT COMPLETE                             ');
  console.log('================================================================');
  process.exit(0);
};

runDiagnostics();

