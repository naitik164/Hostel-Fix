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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'Google Client ID is not configured on the server. Please check GOOGLE_CLIENT_ID in server/.env.',
      });
    }

    // Initialize Google OAuth2 client with configured client ID
    const googleClient = new OAuth2Client(clientId);
    let ticket;

    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (err) {
      console.warn('[Google Auth] Token verification rejected:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid, expired, or incorrectly targeted Google ID token. Verification failed.',
      });
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Google ID token is missing required user identity claims (sub, email).',
      });
    }

    // Require verified email claim
    if (!payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Google email address is not verified. Please verify your email with Google first.',
      });
    }

    const googleSub = payload.sub; // Stable external subject identifier
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || 'Student';
    const picture = payload.picture || '';

    // 1. Primary lookup by stable Google subject ID
    let student = await User.findOne({ googleSub });

    if (!student) {
      // 2. Safe account linking: check if a student was pre-registered with this verified email
      const existingByEmail = await User.findOne({ email });

      if (existingByEmail) {
        // Prevent account hijacking: If already linked to a different googleSub, reject with conflict
        if (existingByEmail.googleSub && existingByEmail.googleSub !== googleSub) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email is already linked to a different Google identity.',
          });
        }

        // Safe linking: attach verified googleSub to the existing student record
        existingByEmail.googleSub = googleSub;
        if (picture && !existingByEmail.profilePhoto) {
          existingByEmail.profilePhoto = picture;
        }
        if (name && (!existingByEmail.name || existingByEmail.name === 'Student')) {
          existingByEmail.name = name;
        }
        student = await existingByEmail.save();
        console.log(`[Google Auth] Linked existing account (${email}) with Google Sub ID: ${googleSub}`);
      } else {
        // 3. Create new student record with verified profile information
        student = await User.create({
          googleSub,
          email,
          name,
          profilePhoto: picture,
          role: 'student', // Enforce student role on server
          isActive: true,
        });
        console.log(`[Google Auth] Created new student account: ${student.email} (${student.googleSub})`);
      }
    } else {
      // Student already linked by googleSub: sync profile image/name if changed on Google
      let changed = false;
      if (picture && student.profilePhoto !== picture) {
        student.profilePhoto = picture;
        changed = true;
      }
      if (name && student.name !== name && student.name === 'Student') {
        student.name = name;
        changed = true;
      }
      if (changed) {
        await student.save();
      }
    }

    // 4. Check if account is active
    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your student account has been deactivated by the administration.',
      });
    }

    // 5. Establish secure application session
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
        hostelBlock: student.hostelBlock || '',
        roomNumber: student.roomNumber || '',
        profilePhoto: student.profilePhoto || '',
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
