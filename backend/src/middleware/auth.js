const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Session = require('../models/Session');

// High-performance in-memory session cache (30s TTL)
// Avoids 2 roundtrips to MongoDB Atlas on every single authenticated HTTP request
const sessionCache = new Map();
const userSessionIndex = new Map();
const SESSION_CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL

// Periodic cleanup of expired cache entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, entry] of sessionCache.entries()) {
    if (now - entry.cachedAt > SESSION_CACHE_TTL_MS) {
      invalidateSessionCache(sessionId);
    }
  }
}, 60000).unref();

const invalidateSessionCache = (sessionId) => {
  if (!sessionId) return;
  const entry = sessionCache.get(sessionId);
  if (entry && entry.user && entry.user.id) {
    const userId = entry.user.id;
    const sessionSet = userSessionIndex.get(userId);
    if (sessionSet) {
      sessionSet.delete(sessionId);
      if (sessionSet.size === 0) userSessionIndex.delete(userId);
    }
  }
  sessionCache.delete(sessionId);
};

const invalidateUserCache = (userId) => {
  if (!userId) return;
  const userIdStr = userId.toString();
  const sessionSet = userSessionIndex.get(userIdStr);
  if (sessionSet) {
    for (const sid of sessionSet) {
      sessionCache.delete(sid);
    }
    userSessionIndex.delete(userIdStr);
  }
};

const authenticate = async (req, res, next) => {
  const tAuthStart = performance.now();

  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization Bearer header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session or token found.',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    // Reject tokens lacking valid server-managed session identifier
    if (!decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session identifier missing or invalid. Please log in again.',
      });
    }

    // Fast-path: Check in-memory session cache to avoid duplicate DB queries
    const cachedEntry = sessionCache.get(decoded.sessionId);
    if (cachedEntry && (Date.now() - cachedEntry.cachedAt < SESSION_CACHE_TTL_MS)) {
      const { activeSession, user } = cachedEntry;
      if (activeSession && activeSession.isActive && (!activeSession.expiresAt || new Date(activeSession.expiresAt) > new Date())) {
        req.user = user;
        const tDuration = performance.now() - tAuthStart;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[AUTH CACHE HIT] [${req.method} ${req.originalUrl}] Verified in ${tDuration.toFixed(2)}ms for ${user.role} (${user.id})`);
        }
        return next();
      } else {
        invalidateSessionCache(decoded.sessionId);
      }
    }

    // Run Session verification and Account lookup concurrently using lightweight .lean() queries
    const tDbStart = performance.now();
    let accountPromise;
    if (decoded.role === 'admin') {
      accountPromise = Admin.findById(decoded.id).select('-passwordHash').lean();
    } else if (decoded.role === 'student') {
      accountPromise = User.findById(decoded.id).lean();
    } else if (decoded.role === 'staff') {
      accountPromise = Staff.findById(decoded.id).lean();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Unknown user role specified in session token.',
      });
    }

    const [activeSession, account] = await Promise.all([
      Session.findById(decoded.sessionId).lean(),
      accountPromise,
    ]);

    const tDbDuration = performance.now() - tDbStart;

    if (!activeSession || !activeSession.isActive || (activeSession.expiresAt && activeSession.expiresAt < new Date())) {
      invalidateSessionCache(decoded.sessionId);
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated or expired. Please log in again.',
      });
    }

    if (!account) {
      invalidateSessionCache(decoded.sessionId);
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists.',
      });
    }

    if (!account.isActive) {
      invalidateSessionCache(decoded.sessionId);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administration.',
      });
    }

    const isProfileCompleted = decoded.role === 'student'
      ? Boolean(account.profileCompleted === true || (account.hostelBlock && account.roomNumber && account.phone))
      : true;

    req.user = {
      id: account._id.toString(),
      _id: account._id,
      name: account.name,
      fullName: account.name,
      email: account.email || account.loginId || '',
      role: account.role || decoded.role,
      hostelBlock: account.hostelBlock || '',
      roomNumber: account.roomNumber || '',
      hostelAddress: account.hostelAddress || '',
      profilePhoto: account.profilePhoto || '',
      phone: account.phone || '',
      phoneNumber: account.phone || '',
      enrollmentNumber: account.enrollmentNumber || '',
      gender: account.gender || '',
      collegeName: account.collegeName || 'LNCTE',
      branch: account.branch || '',
      academicYear: account.academicYear || '',
      rollNumber: account.rollNumber || '',
      employeeId: account.employeeId || '',
      specialization: account.specialization || '',
      assignedBlocks: account.assignedBlocks || [],
      profileCompleted: isProfileCompleted,
      isProfileComplete: isProfileCompleted,
      profileCompletedAt: account.profileCompletedAt || null,
    };

    // Store in session cache
    sessionCache.set(decoded.sessionId, {
      activeSession,
      user: req.user,
      cachedAt: Date.now(),
    });

    if (!userSessionIndex.has(req.user.id)) {
      userSessionIndex.set(req.user.id, new Set());
    }
    userSessionIndex.get(req.user.id).add(decoded.sessionId);

    const tAuthDuration = performance.now() - tAuthStart;
    console.log(`[AUTH MIDDLEWARE] [${req.method} ${req.originalUrl}] Authentication verified in ${tAuthDuration.toFixed(1)}ms for ${req.user.role} (${req.user.id})`);

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication verification.',
    });
  }
};

/**
 * Middleware: Strictly block incomplete student profiles from accessing protected student features
 */
const requireProfileComplete = (req, res, next) => {
  if (req.user && req.user.role === 'student' && !req.user.profileCompleted) {
    return res.status(403).json({
      success: false,
      code: 'PROFILE_INCOMPLETE',
      message: 'Please complete your student profile onboarding before accessing hostel services.',
    });
  }
  next();
};

authenticate.requireProfileComplete = requireProfileComplete;
authenticate.authenticate = authenticate;
authenticate.invalidateSessionCache = invalidateSessionCache;
authenticate.invalidateUserCache = invalidateUserCache;

module.exports = authenticate;
module.exports.requireProfileComplete = requireProfileComplete;
module.exports.invalidateSessionCache = invalidateSessionCache;
module.exports.invalidateUserCache = invalidateUserCache;
