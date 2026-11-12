const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (Render, Vercel, Cloudflare) for accurate client IP in rate limiting & secure cookies
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    frameguard: { action: 'deny' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'frame-ancestors': ["'none'"],
      },
    },
  })
);

const isProduction = process.env.NODE_ENV === 'production';
const rawClientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').trim().replace(/\/$/, '');
const allowedOrigins = [
  rawClientOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      
      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app')) {
        callback(null, true);
      } else if (!isProduction) {
        callback(null, true); // Permissive in development
      } else {
        callback(new Error(`Origin ${origin} not allowed by HostelFix CORS policy.`));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploaded complaint photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Fast, ultra-lightweight liveness health check endpoint
// Responds immediately with HTTP 200 when the Express process is alive.
// Never performs database queries. Supports GET and HEAD.
const mongoose = require('mongoose');

app.all(['/api/health', '/health'], (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  res.status(200).json({
    status: 'ok',
    success: true,
    service: 'HostelFix API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Database readiness endpoint with strict 2-second timeout handling
app.get(['/api/health/ready', '/health/ready'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const readyState = mongoose.connection?.readyState;
  const isConnected = readyState === 1;

  if (!isConnected) {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return res.status(503).json({
      status: 'unavailable',
      success: false,
      database: states[readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Ping MongoDB with a strict 2000ms timeout safeguard
    const pingPromise = mongoose.connection.db.admin().ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB ping timed out')), 2000)
    );

    await Promise.race([pingPromise, timeoutPromise]);

    return res.status(200).json({
      status: 'ready',
      success: true,
      database: 'connected',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      success: false,
      database: 'unresponsive',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Request timeout middleware for API routes: prevents dangling connections
app.use('/api', (req, res, next) => {
  req.setTimeout(25000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timed out on the HostelFix server. Please try again.',
      });
    }
  });
  next();
});

// Primary API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
