const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Session = require('../models/Session');

const authenticate = async (req, res, next) => {
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

    // Verify server-side session status if sessionId is present
    if (decoded.sessionId) {
      const activeSession = await Session.findById(decoded.sessionId);
      if (!activeSession || !activeSession.isActive || (activeSession.expiresAt && activeSession.expiresAt < new Date())) {
        return res.status(401).json({
          success: false,
          message: 'Session has been invalidated or expired. Please log in again.',
        });
      }
    } else {
      // Reject tokens lacking valid server-managed session identifier
      return res.status(401).json({
        success: false,
        message: 'Session identifier missing or invalid. Please log in again.',
      });
    }

    // Check account in database and ensure active status
    let account = null;
    if (decoded.role === 'admin') {
      account = await Admin.findById(decoded.id).select('-passwordHash');
    } else if (decoded.role === 'student') {
      account = await User.findById(decoded.id);
    } else if (decoded.role === 'staff') {
      account = await Staff.findById(decoded.id);
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists.',
      });
    }

    if (!account.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administration.',
      });
    }

    const isProfileCompleted = decoded.role === 'student'
      ? (typeof account.checkProfileCompleted === 'function' ? account.checkProfileCompleted() : Boolean(account.profileCompleted))
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

module.exports = authenticate;
module.exports.requireProfileComplete = requireProfileComplete;
