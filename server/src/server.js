const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

// Import dependencies
const app = require('./app');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

// Server port
const PORT = process.env.PORT || 5000;

// Start server
const startServer = () => {
  try {
    // 1. Start Express HTTP server immediately so port 5000 binds within ~20ms.
    // This allows Render and reverse proxies to detect service health without waiting on database connection.
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[HostelFix Server] Running on port ${PORT}`);
      console.log(`[HostelFix Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 2. Configure HTTP socket and keep-alive timeouts for Render / Cloudflare reverse proxies
    server.timeout = 25000; // 25s timeout for incoming requests
    server.keepAliveTimeout = 65000; // Keep-alive higher than reverse proxy timeout (Render is 60s)
    server.headersTimeout = 66000; // Headers timeout slightly higher than keepAliveTimeout

    // 3. Initiate MongoDB Atlas connection concurrently in the background
    connectDB()
      .then(() => {
        console.log(`[HostelFix Server] MongoDB Connected: ${mongoose.connection.readyState === 1}`);

        // Run non-blocking MongoDB diagnostics in development only after connection is verified
        if (process.env.NODE_ENV !== 'production' && mongoose.connection.db) {
          mongoose.connection.db.admin().command({
            connectionStatus: 1,
            showPrivileges: false,
          }).then(() => {
            console.log(`[Database Diagnostics] Connected DB: ${mongoose.connection.name}`);
          }).catch(() => {
            // Non-critical diagnostic info
          });
        }
      })
      .catch((error) => {
        console.error('[HostelFix Server Error]: Background MongoDB connection failed:', error.message);
      });

    // 4. Graceful process shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`[HostelFix Server] Received ${signal}. Closing HTTP server gracefully...`);
      server.close(async () => {
        console.log('[HostelFix Server] HTTP server closed.');
        try {
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            console.log('[HostelFix Server] MongoDB connection closed.');
          }
        } catch (e) {
          console.error('[HostelFix Server Error]: Error closing database connection:', e.message);
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
    console.error(
      '[HostelFix Server Error]: Failed to start server:',
      error
    );

    process.exit(1);
  }
};

// Initialize server
startServer();
