const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers on Windows to prevent querySrv ECONNREFUSED with Atlas SRV records.
// On Linux/Render containers, preserve system resolver to avoid DNS delays.
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    // Proceed with system resolver if platform restricts override
  }
}

// Disable Mongoose global operation buffering.
// This prevents queries from silently buffering for 10,000ms and timing out when disconnected.
// Unconnected operations fail fast so the API can return an immediate HTTP 503 Service Unavailable.
mongoose.set('bufferCommands', false);

// Singleton connection promise to prevent duplicate concurrent connection attempts
let connectionPromise = null;
let isEventsAttached = false;

// Safe URI string masker to prevent exposing credentials in server logs
const maskUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return '[masked]';
  }
};

const connectDB = async () => {
  // 1. If already connected, return active connection pool
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. If a connection attempt is currently in-flight, return the existing singleton promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // 3. If Mongoose is already in the process of connecting, await its built-in promise
  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const errMsg = '[Database Error] MONGODB_URI is not defined in environment variables. Atlas connection required.';
    console.error(errMsg);
    throw new Error(errMsg);
  }

  // Recommended production connection options
  const connectionOptions = {
    dbName: 'hostelfix',
    maxPoolSize: 10,                 // Up to 10 connections for concurrent requests
    minPoolSize: 2,                  // Keep 2 connections warm to eliminate cold-handshake delays
    serverSelectionTimeoutMS: 5000,  // Fast-fail server selection (5s) instead of hanging indefinitely
    connectTimeoutMS: 10000,         // 10s initial connection timeout
    socketTimeoutMS: 45000,          // 45s socket timeout for heavy queries
    bufferCommands: false,           // Fail fast on disconnected queries instead of 10s buffering
  };

  // Attach connection lifecycle monitoring handlers once
  if (!isEventsAttached) {
    mongoose.connection.on('connected', () => {
      console.log(`[Database] [${new Date().toISOString()}] MongoDB Atlas connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[Database Warning] [${new Date().toISOString()}] MongoDB connection lost. Driver auto-reconnecting...`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`[Database Info] [${new Date().toISOString()}] MongoDB reconnected successfully.`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] [${new Date().toISOString()}] MongoDB driver error: ${err.message}`);
    });

    isEventsAttached = true;
  }

  const startTime = Date.now();
  console.log(`[Database] Initiating MongoDB Atlas connection (${maskUri(uri)})...`);

  connectionPromise = mongoose.connect(uri, connectionOptions)
    .then((conn) => {
      const duration = Date.now() - startTime;
      console.log(`[Database] MongoDB Atlas Connected in ${duration}ms: ${conn.connection.host}/${conn.connection.name} (pool: min 2, max 10)`);
      connectionPromise = null;
      return conn;
    })
    .catch((error) => {
      connectionPromise = null;
      const duration = Date.now() - startTime;
      console.error(`[Database Error] Atlas connection failed after ${duration}ms: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
