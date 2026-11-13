const path = require('path');

// 1. Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});
require('dotenv').config(); // System environment variable fallback

// Import application and database dependencies
const app = require('./app');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

// Server port
const PORT = process.env.PORT || 5000;

// Safe URI string masker to prevent credential leaks in logs
const maskUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return '[masked]';
  }
};

// Start server: Connects to MongoDB Atlas first, then starts accepting HTTP traffic
const startServer = async () => {
  try {
    console.log('[HostelFix Server] Initializing server...');
    console.log(`[HostelFix Server] Environment: ${process.env.NODE_ENV || 'development'}`);

    // Verify presence of required database URI
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('================================================================');
      console.error('[HostelFix Server Fatal Error] MONGODB_URI is not defined in environment variables.');
      console.error('For Render deployment: Configure MONGODB_URI in Render Dashboard -> Environment Variables.');
      console.error('================================================================');
      process.exit(1);
    }

    console.log(`[HostelFix Server] Connecting to MongoDB Atlas (${maskUri(uri)})...`);

    // 2. Await MongoDB Atlas connection before binding port and accepting traffic
    await connectDB();

    // 3. Verify database readiness
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database connection readyState is ${mongoose.connection.readyState} (expected 1: connected).`);
    }

    console.log(`[HostelFix Server] Database verified: connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

    // 4. Start Express HTTP server ONLY after database connection is fully established
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[HostelFix Server] Server running and accepting traffic on port ${PORT}`);
    });

    // 5. Configure HTTP socket and keep-alive timeouts for Render / Cloudflare reverse proxies
    server.timeout = 25000;         // 25s timeout for incoming requests
    server.keepAliveTimeout = 65000; // Keep-alive higher than reverse proxy timeout (Render is 60s)
    server.headersTimeout = 66000;   // Headers timeout slightly higher than keepAliveTimeout

    // 6. Graceful process shutdown handling (SIGTERM & SIGINT)
    const gracefulShutdown = (signal) => {
      console.log(`[HostelFix Server] Received ${signal}. Closing HTTP server gracefully...`);
      server.close(async () => {
        console.log('[HostelFix Server] HTTP server closed.');
        try {
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            console.log('[HostelFix Server] MongoDB connection closed cleanly.');
          }
        } catch (e) {
          console.error('[HostelFix Server Error] Error closing database connection:', e.message);
        }
        process.exit(0);
      });

      // Force process exit if teardown hangs
      setTimeout(() => {
        console.error('[HostelFix Server] Forceful shutdown initiated after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('================================================================');
    console.error('[HostelFix Server Fatal Error] Server startup aborted: Database connection failed.');
    console.error(`Error details: ${error.message}`);
    console.error('');
    console.error('Diagnostic Steps for MongoDB Atlas / Render:');
    console.error(' 1. MongoDB Atlas Network Access Whitelist:');
    console.error('    - Log in to cloud.mongodb.com -> Network Access -> IP Access List.');
    console.error('    - Ensure 0.0.0.0/0 (Allow Access from Anywhere) is active.');
    console.error('      (Render containers use dynamic outbound IPs that change on every deploy/restart).');
    console.error(' 2. Verify Render Environment Variables:');
    console.error('    - Verify MONGODB_URI in Render Dashboard -> Environment.');
    console.error('    - Ensure the database user has "readWriteAnyDatabase" or "readWrite" privileges.');
    console.error(' 3. Cluster State: Ensure the Atlas cluster is active and not paused.');
    console.error('================================================================');
    process.exit(1);
  }
};

// Initialize server
startServer();
