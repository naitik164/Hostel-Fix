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
// This ensures that operations never buffer for 10,000ms when disconnected.
mongoose.set('bufferCommands', false);

// Connection state tracking (readyState is verified alongside actual connection events)
let isConnected = false;
let isConnecting = false;
let lastConnectedAt = null;
let lastDisconnectedAt = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
let reconnectTimer = null;
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

/**
 * Returns accurate database readiness and telemetry
 */
const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateStr = states[readyState] || 'unknown';

  return {
    isReady: isConnected && readyState === 1,
    state: isConnected && readyState === 1 ? 'connected' : stateStr,
    readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    lastConnectedAt,
    lastDisconnectedAt,
    reconnectAttempts,
  };
};

/**
 * Predicate to check if the database is healthy and ready to accept queries
 */
const isDatabaseReady = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Centralized controlled reconnection with exponential backoff
 */
const scheduleReconnect = () => {
  if (reconnectTimer) return;
  if (isConnected && mongoose.connection.readyState === 1) return;

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn(`[Database Warning] Reached maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}). Pausing retries.`);
    return;
  }

  reconnectAttempts++;
  // Exponential backoff: 2s, 4s, 8s, 16s, capped at 30s
  const backoffMs = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), 30000);
  console.log(`[Database] Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoffMs / 1000}s...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connectDB();
    } catch (err) {
      if (!isDatabaseReady()) {
        scheduleReconnect();
      }
    }
  }, backoffMs);

  if (reconnectTimer.unref) reconnectTimer.unref();
};

/**
 * Centralized MongoDB Atlas connection manager (Singleton)
 */
const connectDB = async () => {
  // 1. If already connected, return active connection
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
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

  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    const errMsg = '[Database Error] MONGODB_URI is not defined in environment variables. Atlas connection required.';
    console.error(errMsg);
    throw new Error(errMsg);
  }

  // Ensure database name is explicitly specified in the URI path if missing
  let uri = rawUri.trim();
  if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
    const urlParts = uri.split('?');
    const base = urlParts[0].replace(/\/+$/, '');
    const query = urlParts[1] ? `?${urlParts[1]}` : '?retryWrites=true&w=majority';
    if (!base.includes('/', base.indexOf('//') + 2)) {
      uri = `${base}/hostelfix${query}`;
    }
  }

  // Production-grade connection options
  const connectionOptions = {
    dbName: 'hostelfix',
    maxPoolSize: 10,                 // Pool up to 10 connections for concurrent requests
    minPoolSize: 2,                  // Keep 2 connections warm to eliminate cold-handshake delays
    serverSelectionTimeoutMS: 5000,  // Fast-fail server selection (5s) instead of hanging indefinitely
    connectTimeoutMS: 10000,         // 10s initial connection timeout
    socketTimeoutMS: 45000,          // 45s socket timeout for operations
    bufferCommands: false,           // Fail fast on disconnected queries instead of 10s buffering
  };

  // Attach connection lifecycle monitoring handlers once
  if (!isEventsAttached) {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      lastConnectedAt = new Date();
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      console.log(`[Database] [${new Date().toISOString()}] MongoDB Atlas connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      lastDisconnectedAt = new Date();
      console.warn(`[Database Warning] [${new Date().toISOString()}] MongoDB connection lost. Triggering controlled auto-reconnect...`);
      scheduleReconnect();
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      reconnectAttempts = 0;
      console.log(`[Database Info] [${new Date().toISOString()}] MongoDB reconnected successfully.`);
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error(`[Database Error] [${new Date().toISOString()}] MongoDB driver error: ${err.message}`);
    });

    isEventsAttached = true;
  }

  const startTime = Date.now();
  console.log(`[Database] Initiating MongoDB Atlas connection (${maskUri(uri)})...`);
  isConnecting = true;

  connectionPromise = mongoose.connect(uri, connectionOptions)
    .then((conn) => {
      const duration = Date.now() - startTime;
      isConnected = true;
      isConnecting = false;
      reconnectAttempts = 0;
      lastConnectedAt = new Date();
      console.log(`[Database] MongoDB Atlas Connected in ${duration}ms: ${conn.connection.host}/${conn.connection.name} (pool: min 2, max 10)`);
      connectionPromise = null;
      return conn;
    })
    .catch((error) => {
      isConnected = false;
      isConnecting = false;
      connectionPromise = null;
      const duration = Date.now() - startTime;
      console.error(`[Database Error] Atlas connection failed after ${duration}ms: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDatabaseStatus = getDatabaseStatus;
module.exports.isDatabaseReady = isDatabaseReady;
module.exports.scheduleReconnect = scheduleReconnect;
