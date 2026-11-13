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

// Server port: Use Render's assigned PORT in production, fallback to 5000 in development
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

let server = null;
let reconnectTimer = null;

// Controlled database connection manager with automatic retry
const initiateDbConnection = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[HostelFix Server Warning] MONGODB_URI is not defined in environment variables.');
    console.error('[HostelFix Server Warning] Database-dependent routes will return HTTP 503.');
    return;
  }

  try {
    await connectDB();
    console.log(`[HostelFix Server] MongoDB Connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  } catch (error) {
    console.warn(`[HostelFix Server Warning] Initial MongoDB connection attempt failed: ${error.message}`);
    console.warn('[HostelFix Server Warning] Database routes will return HTTP 503 until connection succeeds.');
    console.warn('[HostelFix Server Warning] Ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.');

    // Schedule controlled reconnection attempt in 5 seconds
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        console.log('[HostelFix Server] Retrying MongoDB connection...');
        initiateDbConnection();
      }, 5000);
      if (reconnectTimer.unref) reconnectTimer.unref();
    }
  }
};

// Start server: Bind Express promptly so Render and Vite proxies detect the running service
const startServer = () => {
  try {
    console.log('[HostelFix Server] Initializing server...');
    console.log(`[HostelFix Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[HostelFix Server] Target Port: ${PORT}`);

    // 1. Start Express HTTP server promptly.
    // This allows Render health checks and Vite development proxies to immediately detect the alive service.
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[HostelFix Server] HTTP server listening and accepting traffic on port ${PORT}`);
    });

    // 2. Configure HTTP socket and keep-alive timeouts for Render / Cloudflare reverse proxies
    server.timeout = 25000;          // 25s timeout for incoming requests
    server.keepAliveTimeout = 65000;  // Higher than reverse proxy timeout (Render is 60s)
    server.headersTimeout = 66000;    // Slightly higher than keepAliveTimeout

    // 3. Initiate MongoDB connection concurrently in the background without blocking port binding
    initiateDbConnection();

    // 4. Graceful process shutdown handling (SIGTERM & SIGINT)
    const gracefulShutdown = (signal) => {
      console.log(`[HostelFix Server] Received ${signal}. Closing HTTP server gracefully...`);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (server) {
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
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('================================================================');
    console.error('[HostelFix Server Fatal Error] Could not bind HTTP port:');
    console.error(`Error details: ${error.message}`);
    console.error('================================================================');
    process.exit(1);
  }
};

// Initialize server
startServer();
