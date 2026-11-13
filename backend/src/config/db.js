const mongoose = require('mongoose');
const dns = require('dns');

// Disable Mongoose global operation buffering to prevent 10,000ms request hangs
mongoose.set('bufferCommands', false);

// Connection state tracking
let isConnected = false;
let isConnecting = false;
let lastConnectedAt = null;
let lastDisconnectedAt = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
let reconnectTimer = null;
let connectionPromise = null;
let isEventsAttached = false;
let hasAppliedDnsFallback = false;

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

  // Ensure database name is explicitly specified in the URI path
  let uri = rawUri.trim();
  if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
    const urlParts = uri.split('?');
    const base = urlParts[0].replace(/\/+$/, '');
    const query = urlParts[1] ? `?${urlParts[1]}` : '?retryWrites=true&w=majority';
    if (!base.includes('/', base.indexOf('//') + 2)) {
      uri = `${base}/hostelfix${query}`;
    }
  }

  // Standard production-grade connection options (TLS verification strictly enabled)
  const connectionOptions = {
    dbName: 'hostelfix',
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
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

  const attemptConnection = () => {
    return mongoose.connect(uri, connectionOptions);
  };

  connectionPromise = attemptConnection()
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
    .catch(async (error) => {
      // Adaptive fallback: if local DNS stub refused querySrv, apply public DNS and retry once
      if (!hasAppliedDnsFallback && error.message && error.message.includes('querySrv ECONNREFUSED')) {
        console.warn('[Database] Local DNS proxy refused SRV lookup (querySrv ECONNREFUSED). Enabling DNS fallback (8.8.8.8, 1.1.1.1) and retrying...');
        hasAppliedDnsFallback = true;
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1']);
          const conn = await attemptConnection();
          const duration = Date.now() - startTime;
          isConnected = true;
          isConnecting = false;
          reconnectAttempts = 0;
          lastConnectedAt = new Date();
          console.log(`[Database] MongoDB Atlas Connected after DNS fallback in ${duration}ms: ${conn.connection.host}/${conn.connection.name}`);
          connectionPromise = null;
          return conn;
        } catch (retryError) {
          error = retryError;
        }
      }

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
module.exports.maskUri = maskUri;
