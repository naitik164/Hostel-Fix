const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers ONLY on Windows to prevent querySrv ECONNREFUSED.
// On Linux/Render containers, preserve the system/container resolver to avoid DNS delays.
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    // Proceed with system resolver if platform restricts override
  }
}

// Singleton connection promise to prevent duplicate concurrent connection attempts
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, reuse the active connection pool
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database Error]: MONGODB_URI is not defined in server/.env. Atlas connection required.');
    process.exit(1);
  }

  const connectionOptions = {
    dbName: 'hostelfix',
    maxPoolSize: 10, // Maintain up to 10 connections for concurrent requests
    minPoolSize: 2,  // Keep at least 2 connections warm to eliminate cold-handshake delays
    maxIdleTimeMS: 30000, // Recycle idle sockets before MongoDB Atlas drops them
    serverSelectionTimeoutMS: 5000, // Fast-fail server selection to prevent indefinite hangs
    socketTimeoutMS: 45000, // Allow 45s for heavy operations before socket timeout
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000, // Monitor connection health every 10s to keep connections alive
  };

  const startTime = Date.now();

  connectionPromise = mongoose.connect(uri, connectionOptions)
    .then((conn) => {
      const duration = Date.now() - startTime;
      console.log(`[Database] MongoDB Atlas Connected in ${duration}ms: ${conn.connection.host}/${conn.connection.name} (pool: min 2, max 10)`);
      connectionPromise = null;
      return conn;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(`[Database Error] Atlas connection failed after ${Date.now() - startTime}ms: ${error.message}`);
      throw error;
    });

  // Attach connection lifecycle event handlers for diagnostics
  mongoose.connection.on('disconnected', () => {
    console.warn(`[Database Warning] [${new Date().toISOString()}] MongoDB connection disconnected. Auto-reconnecting...`);
  });

  mongoose.connection.on('reconnected', () => {
    console.log(`[Database Info] [${new Date().toISOString()}] MongoDB reconnected successfully.`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] [${new Date().toISOString()}] MongoDB error: ${err.message}`);
  });

  return connectionPromise;
};

module.exports = connectDB;


