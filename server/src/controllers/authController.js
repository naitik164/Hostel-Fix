const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Session = require('../models/Session');
const { generateToken, verifyToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

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

    // Validate token issuer and expiration explicitly
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token issuer.',
      });
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return res.status(401).json({
        success: false,
        message: 'Google ID token has expired.',
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

    // Defense-in-depth: Ensure Google student account cannot collide with admin accounts
    const adminCollision = await Admin.findOne({ loginId: email });
    if (adminCollision) {
      return res.status(403).json({
        success: false,
        message: 'Administrative accounts must authenticate through the warden portal.',
      });
    }

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

    // 5. Establish secure server-managed application session
    const session = await Session.create({
      userId: student._id,
      role: 'student',
      isActive: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken({
      id: student._id.toString(),
      role: 'student',
      email: student.email,
      sessionId: session._id.toString(),
    });

    setAuthCookie(res, token);

    const isComplete = typeof student.checkProfileCompleted === 'function'
      ? student.checkProfileCompleted()
      : Boolean(student.profileCompleted);

    return res.status(200).json({
      success: true,
      message: 'Student authenticated successfully via Google.',
      token,
      user: {
        id: student._id,
        _id: student._id,
        name: student.name,
        fullName: student.name,
        email: student.email,
        role: 'student',
        hostelBlock: student.hostelBlock || '',
        roomNumber: student.roomNumber || '',
        hostelAddress: student.hostelAddress || '',
        profilePhoto: student.profilePhoto || '',
        phone: student.phone || '',
        phoneNumber: student.phone || '',
        enrollmentNumber: student.enrollmentNumber || '',
        gender: student.gender || '',
        collegeName: student.collegeName || 'LNCTE',
        branch: student.branch || '',
        academicYear: student.academicYear || '',
        rollNumber: student.rollNumber || '',
        profileCompleted: isComplete,
        isProfileComplete: isComplete,
        profileCompletedAt: student.profileCompletedAt || null,
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
      // Deterministic unique demo googleSub based on sha256 hash of email
      const demoSub = `demo_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 22)}`;
      student = await User.create({
        name: req.body.name || 'Aarav Sharma',
        email,
        googleSub: demoSub,
        profilePhoto: '',
        role: 'student',
        hostelBlock: 'Block A',
        roomNumber: 'A-304',
        phone: '+91 98765 43210',
        isActive: true,
      });
    }

    // Create server-managed session
    const session = await Session.create({
      userId: student._id,
      role: 'student',
      isActive: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken({
      id: student._id.toString(),
      role: 'student',
      email: student.email,
      sessionId: session._id.toString(),
    });

    setAuthCookie(res, token);

    const isComplete = typeof student.checkProfileCompleted === 'function'
      ? student.checkProfileCompleted()
      : Boolean(student.profileCompleted);

    return res.status(200).json({
      success: true,
      message: 'Logged in as Demo Student.',
      token,
      user: {
        id: student._id,
        _id: student._id,
        name: student.name,
        fullName: student.name,
        email: student.email,
        role: 'student',
        hostelBlock: student.hostelBlock || '',
        roomNumber: student.roomNumber || '',
        hostelAddress: student.hostelAddress || '',
        profilePhoto: student.profilePhoto || '',
        phone: student.phone || '',
        phoneNumber: student.phone || '',
        enrollmentNumber: student.enrollmentNumber || '',
        gender: student.gender || '',
        collegeName: student.collegeName || 'LNCTE',
        branch: student.branch || '',
        academicYear: student.academicYear || '',
        rollNumber: student.rollNumber || '',
        profileCompleted: isComplete,
        isProfileComplete: isComplete,
        profileCompletedAt: student.profileCompletedAt || null,
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

    // Create server-managed admin session
    const session = await Session.create({
      userId: admin._id,
      role: 'admin',
      isActive: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken({
      id: admin._id.toString(),
      role: 'admin',
      email: admin.loginId,
      sessionId: session._id.toString(),
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
 * Logout - Server-side session invalidation and cookie clearance
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.sessionId) {
        await Session.findByIdAndUpdate(decoded.sessionId, { isActive: false });
      }
    }

    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Application session invalidated.',
    });
  } catch (error) {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
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

/**
 * Staff Google OAuth Authentication
 * POST /api/auth/staff/google
 */
const staffGoogleLogin = async (req, res, next) => {
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
        message: 'Google Client ID is not configured on the server.',
      });
    }

    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (err) {
      console.warn('[Staff Google Auth] Token verification rejected:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid, expired, or untrusted Google ID token.',
      });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Google ID token is missing required identity claims.',
      });
    }

    // Validate token issuer and expiration explicitly
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token issuer.',
      });
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return res.status(401).json({
        success: false,
        message: 'Google ID token has expired.',
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Google email address is not verified. Please verify your email with Google first.',
      });
    }

    const googleSub = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || 'Staff Member';
    const picture = payload.picture || '';

    // 1. Primary lookup by stable googleSub
    let staff = await Staff.findOne({ googleSub });

    if (!staff) {
      // 2. Lookup by pre-registered Google email
      const staffByEmail = await Staff.findOne({ email });

      if (!staffByEmail) {
        return res.status(403).json({
          success: false,
          message: `Access denied. The Google account "${email}" is not registered as an authorized HostelFix staff member. Please contact the Chief Warden office to register your staff profile.`,
        });
      }

      // Check conflict if already linked to another sub
      if (staffByEmail.googleSub && staffByEmail.googleSub !== googleSub) {
        return res.status(409).json({
          success: false,
          message: 'This staff email is already securely linked to a different Google identity. Please contact the Chief Warden to reset your link.',
        });
      }

      // Securely link verified googleSub to staff record
      staffByEmail.googleSub = googleSub;
      if (picture && !staffByEmail.profilePhoto) {
        staffByEmail.profilePhoto = picture;
      }
      staff = await staffByEmail.save();
      console.log(`[Staff Google Auth] Successfully linked staff account (${email}) with Google Sub ID: ${googleSub}`);
    }

    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your staff account has been deactivated. Please contact the Chief Warden office.',
      });
    }

    // Update last login timestamp
    staff.lastLoginAt = new Date();
    await staff.save();

    // Create server-managed session in MongoDB Atlas
    const session = await Session.create({
      userId: staff._id,
      role: 'staff',
      isActive: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken({
      id: staff._id.toString(),
      role: 'staff',
      email: staff.email,
      sessionId: session._id.toString(),
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Staff authenticated successfully.',
      token,
      user: {
        id: staff._id,
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: 'staff',
        specialization: staff.specialization,
        department: staff.department || staff.specialization,
        employeeId: staff.employeeId,
        assignedBlocks: staff.assignedBlocks || [],
        phone: staff.phone || '',
        profilePhoto: staff.profilePhoto || picture,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Demo Staff Login (for automated test suite & development)
 * POST /api/auth/demo-staff-login
 */
const demoStaffLogin = async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: `No authorized staff record found for "${email}". Please register the staff member via Warden Portal first.`,
      });
    }

    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your staff account has been deactivated. Please contact the Chief Warden office.',
      });
    }

    staff.lastLoginAt = new Date();
    await staff.save();

    const session = await Session.create({
      userId: staff._id,
      role: 'staff',
      isActive: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken({
      id: staff._id.toString(),
      role: 'staff',
      email: staff.email,
      sessionId: session._id.toString(),
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in as Staff.',
      token,
      user: {
        id: staff._id,
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: 'staff',
        specialization: staff.specialization,
        department: staff.department || staff.specialization,
        employeeId: staff.employeeId,
        assignedBlocks: staff.assignedBlocks || [],
        phone: staff.phone || '',
        profilePhoto: staff.profilePhoto || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleLogin,
  demoStudentLogin,
  adminLogin,
  staffGoogleLogin,
  demoStaffLogin,
  logout,
  getMe,
};
