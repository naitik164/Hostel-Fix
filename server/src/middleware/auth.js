const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Admin = require('../models/Admin');

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

    // Check account in database and ensure active status
    let account = null;
    if (decoded.role === 'admin') {
      account = await Admin.findById(decoded.id).select('-passwordHash');
    } else if (decoded.role === 'student') {
      account = await User.findById(decoded.id);
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

    req.user = {
      id: account._id.toString(),
      _id: account._id,
      name: account.name,
      email: account.email || account.loginId,
      role: account.role,
      hostelBlock: account.hostelBlock || '',
      roomNumber: account.roomNumber || '',
      profilePhoto: account.profilePhoto || '',
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

module.exports = authenticate;
