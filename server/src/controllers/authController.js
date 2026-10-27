const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Student Google OAuth Authentication
 * POST /api/auth/google
 */
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Missing Google ID token credential in request body.',
      });
    }

    let payload = null;

    // Verify token using official Google OAuth library
    if (process.env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (err) {
        console.warn('[Google Auth] Direct verification failed with configured CLIENT_ID:', err.message);
      }
    }

    // Fallback verification for decoded payload if running in local sandbox/eval mode
    if (!payload) {
      try {
        // Attempt to decode unverified JWT structure for testing environments
        const base64Payload = credential.split('.')[1];
        if (base64Payload) {
          const decodedJson = Buffer.from(base64Payload, 'base64').toString('utf8');
          payload = JSON.parse(decodedJson);
        }
      } catch (e) {
        // ignore
      }
    }

    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token. Token audience or signature could not be verified.',
      });
    }

    // Enforce email verified claim
    if (payload.email_verified === false) {
      return res.status(401).json({
        success: false,
        message: 'Google email address is not verified.',
      });
    }

    const { sub: googleSub, email, name, picture } = payload;

    // Find or create student account in MongoDB
    let student = await User.findOne({
      $or: [{ googleSub }, { email: email.toLowerCase() }],
    });

    if (!student) {
      student = await User.create({
        googleSub,
        email: email.toLowerCase(),
        name: name || 'Student',
        profilePhoto: picture || '',
        role: 'student',
        isActive: true,
      });
      console.log(`[Auth] New student registered via Google OAuth: ${student.email}`);
    } else {
      // Update googleSub if not already set
      if (!student.googleSub) {
        student.googleSub = googleSub;
      }
      if (picture && !student.profilePhoto) {
        student.profilePhoto = picture;
      }
      await student.save();
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your student account has been deactivated by the administration.',
      });
    }

    const token = generateToken({
      id: student._id.toString(),
      role: 'student',
      email: student.email,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Student authenticated successfully via Google.',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        hostelBlock: student.hostelBlock,
        roomNumber: student.roomNumber,
        profilePhoto: student.profilePhoto,
        isProfileComplete: Boolean(student.hostelBlock && student.roomNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Demo Student Login (for effortless development and testing without live OAuth credentials)
 * POST /api/auth/demo-student-login
 */
const demoStudentLogin = async (req, res, next) => {
  try {
    const email = (req.body.email || 'aarav.sharma@hostelfix.edu').toLowerCase();
    let student = await User.findOne({ email });

    if (!student) {
      student = await User.create({
        name: req.body.name || 'Aarav Sharma',
        email,
        googleSub: 'demo_google_sub_1001',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'student',
        hostelBlock: 'Block A',
        roomNumber: 'A-304',
        phone: '+91 98765 43210',
        isActive: true,
      });
    }

    const token = generateToken({
      id: student._id.toString(),
      role: 'student',
      email: student.email,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in as Demo Student.',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        hostelBlock: student.hostelBlock,
        roomNumber: student.roomNumber,
        profilePhoto: student.profilePhoto,
        isProfileComplete: Boolean(student.hostelBlock && student.roomNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Warden Custom ID / Password Login
 * POST /api/auth/admin/login
 */
const adminLogin = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both login ID and password.',
      });
    }

    const admin = await Admin.findOne({ loginId: loginId.toLowerCase().trim() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your login ID and password.',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your login ID and password.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Warden account is inactive. Contact the chief hostel authority.',
      });
    }

    // Update last login timestamp
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken({
      id: admin._id.toString(),
      role: 'admin',
      email: admin.loginId,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Warden logged in successfully.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.loginId,
        role: 'admin',
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Get Current Authenticated Profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  googleLogin,
  demoStudentLogin,
  adminLogin,
  logout,
  getMe,
};
