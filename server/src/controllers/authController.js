const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Session = require('../models/Session');
const { generateToken, verifyToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');
const { invalidateSessionCache } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Student Google OAuth Authentication
 * POST /api/auth/google
 */
const googleLogin = async (req, res, next) => {
  const tRequestReceived = performance.now();
  console.log(`[AUTH TIMING] [${new Date().toISOString()}] Request received by backend: POST /api/auth/google`);

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

    // Google token verification
    const tTokenStart = performance.now();
    const googleClient = new OAuth2Client(clientId);
    let ticket;

    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (err) {
      const tTokenFail = performance.now() - tTokenStart;
      console.warn(`[AUTH TIMING] [POST /api/auth/google] Google token verification failed after ${tTokenFail.toFixed(1)}ms:`, err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid, expired, or incorrectly targeted Google ID token. Verification failed.',
      });
    }

    const tTokenDuration = performance.now() - tTokenStart;
    console.log(`[AUTH TIMING] [POST /api/auth/google] Google token verification completed in ${tTokenDuration.toFixed(1)}ms`);

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

    // Parallel MongoDB queries: check admin collision and lookup student by googleSub simultaneously
    const tDbStart = performance.now();
    const [adminCollision, existingStudentBySub] = await Promise.all([
      Admin.findOne({ loginId: email }),
      User.findOne({ googleSub }),
    ]);
    const tDbDuration = performance.now() - tDbStart;
    console.log(`[AUTH TIMING] [POST /api/auth/google] MongoDB user lookup completed in ${tDbDuration.toFixed(1)}ms (found by sub: ${Boolean(existingStudentBySub)})`);

    // Defense-in-depth: Ensure Google student account cannot collide with admin accounts
    if (adminCollision) {
      return res.status(403).json({
        success: false,
        message: 'Administrative accounts must authenticate through the warden portal.',
      });
    }

    let student = existingStudentBySub;

    if (!student) {
      // Safe account linking: check if a student was pre-registered with this verified email
      const tLinkStart = performance.now();
      const existingByEmail = await User.findOne({ email });

      if (existingByEmail) {
        if (existingByEmail.googleSub && existingByEmail.googleSub !== googleSub) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email is already linked to a different Google identity.',
          });
        }

        existingByEmail.googleSub = googleSub;
        if (picture && !existingByEmail.profilePhoto) {
          existingByEmail.profilePhoto = picture;
        }
        if (name && (!existingByEmail.name || existingByEmail.name === 'Student')) {
          existingByEmail.name = name;
        }
        student = await existingByEmail.save();
        console.log(`[AUTH TIMING] [POST /api/auth/google] Linked existing student in ${(performance.now() - tLinkStart).toFixed(1)}ms`);
      } else {
        // Create new student record with verified profile information
        student = await User.create({
          googleSub,
          email,
          name,
          profilePhoto: picture,
          role: 'student',
          isActive: true,
        });
        console.log(`[AUTH TIMING] [POST /api/auth/google] Created new student record in ${(performance.now() - tLinkStart).toFixed(1)}ms`);
      }
    } else {
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

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your student account has been deactivated by the administration.',
      });
    }

    // Session & JWT generation
    const tSessionStart = performance.now();
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
    const tSessionDuration = performance.now() - tSessionStart;
    console.log(`[AUTH TIMING] [POST /api/auth/google] JWT/session generation completed in ${tSessionDuration.toFixed(1)}ms`);

    const isComplete = typeof student.checkProfileCompleted === 'function'
      ? student.checkProfileCompleted()
      : Boolean(student.profileCompleted);

    const totalDuration = performance.now() - tRequestReceived;
    console.log(`[AUTH TIMING] [POST /api/auth/google] Final HTTP response sent: SUCCESS (200) | Total elapsed: ${totalDuration.toFixed(1)}ms`);

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
    const totalDuration = performance.now() - tRequestReceived;
    console.error(`[AUTH TIMING] [POST /api/auth/google] Request failed after ${totalDuration.toFixed(1)}ms:`, error.message);
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
  const tRequestReceived = performance.now();
  console.log(`[AUTH TIMING] [${new Date().toISOString()}] Request received by backend: POST /api/auth/admin/login`);

  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both login ID and password.',
      });
    }

    const sanitizedId = loginId.toLowerCase().trim();

    // MongoDB Warden lookup
    const tDbStart = performance.now();
    const admin = await Admin.findOne({ loginId: sanitizedId });
    const tDbDuration = performance.now() - tDbStart;
    console.log(`[AUTH TIMING] [POST /api/auth/admin/login] MongoDB query completed: Warden lookup finished in ${tDbDuration.toFixed(1)}ms (found: ${Boolean(admin)})`);

    if (!admin) {
      const totalDuration = performance.now() - tRequestReceived;
      console.warn(`[AUTH TIMING] [POST /api/auth/admin/login] Authentication failed: Warden not found (${totalDuration.toFixed(1)}ms)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your login ID and password.',
      });
    }

    // Password verification
    const tBcryptStart = performance.now();
    const isMatch = await admin.comparePassword(password);
    const tBcryptDuration = performance.now() - tBcryptStart;
    console.log(`[AUTH TIMING] [POST /api/auth/admin/login] Password verification completed in ${tBcryptDuration.toFixed(1)}ms (valid: ${isMatch})`);

    if (!isMatch) {
      const totalDuration = performance.now() - tRequestReceived;
      console.warn(`[AUTH TIMING] [POST /api/auth/admin/login] Authentication failed: Invalid password (${totalDuration.toFixed(1)}ms)`);
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

    // Concurrent DB operations: Update lastLogin timestamp and create session in parallel
    const tSessionStart = performance.now();
    admin.lastLoginAt = new Date();

    const [_, session] = await Promise.all([
      admin.save(),
      Session.create({
        userId: admin._id,
        role: 'admin',
        isActive: true,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    ]);

    const token = generateToken({
      id: admin._id.toString(),
      role: 'admin',
      email: admin.loginId,
      sessionId: session._id.toString(),
    });

    setAuthCookie(res, token);
    const tSessionDuration = performance.now() - tSessionStart;
    console.log(`[AUTH TIMING] [POST /api/auth/admin/login] JWT/session generation completed in ${tSessionDuration.toFixed(1)}ms`);

    const totalDuration = performance.now() - tRequestReceived;
    console.log(`[AUTH TIMING] [POST /api/auth/admin/login] Final HTTP response sent: SUCCESS (200) | Total elapsed: ${totalDuration.toFixed(1)}ms`);

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
    const totalDuration = performance.now() - tRequestReceived;
    console.error(`[AUTH TIMING] [POST /api/auth/admin/login] Request failed after ${totalDuration.toFixed(1)}ms:`, error.message);
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
        invalidateSessionCache(decoded.sessionId);
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
  const tRequestReceived = performance.now();
  console.log(`[AUTH TIMING] [${new Date().toISOString()}] Request received by backend: POST /api/auth/staff/google`);

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

    // Google token verification
    const tTokenStart = performance.now();
    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (err) {
      const tTokenFail = performance.now() - tTokenStart;
      console.warn(`[AUTH TIMING] [POST /api/auth/staff/google] Google token verification rejected after ${tTokenFail.toFixed(1)}ms:`, err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid, expired, or untrusted Google ID token.',
      });
    }

    const tTokenDuration = performance.now() - tTokenStart;
    console.log(`[AUTH TIMING] [POST /api/auth/staff/google] Google token verification completed in ${tTokenDuration.toFixed(1)}ms`);

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

    // MongoDB Staff lookup
    const tDbStart = performance.now();
    let staff = await Staff.findOne({ googleSub });

    if (!staff) {
      const staffByEmail = await Staff.findOne({ email });

      if (!staffByEmail) {
        const totalDuration = performance.now() - tRequestReceived;
        console.warn(`[AUTH TIMING] [POST /api/auth/staff/google] Access denied: Staff email "${email}" not registered (${totalDuration.toFixed(1)}ms)`);
        return res.status(403).json({
          success: false,
          message: `Access denied. The Google account "${email}" is not registered as an authorized HostelFix staff member. Please contact the Chief Warden office to register your staff profile.`,
        });
      }

      if (staffByEmail.googleSub && staffByEmail.googleSub !== googleSub) {
        return res.status(409).json({
          success: false,
          message: 'This staff email is already securely linked to a different Google identity. Please contact the Chief Warden to reset your link.',
        });
      }

      staffByEmail.googleSub = googleSub;
      if (picture && !staffByEmail.profilePhoto) {
        staffByEmail.profilePhoto = picture;
      }
      staff = await staffByEmail.save();
      console.log(`[AUTH TIMING] [POST /api/auth/staff/google] Linked staff account (${email}) with Google Sub`);
    }

    const tDbDuration = performance.now() - tDbStart;
    console.log(`[AUTH TIMING] [POST /api/auth/staff/google] MongoDB query completed: Staff lookup finished in ${tDbDuration.toFixed(1)}ms`);

    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your staff account has been deactivated. Please contact the Chief Warden office.',
      });
    }

    // Concurrent DB operations: Update lastLogin timestamp and create session in parallel
    const tSessionStart = performance.now();
    staff.lastLoginAt = new Date();

    const [_, session] = await Promise.all([
      staff.save(),
      Session.create({
        userId: staff._id,
        role: 'staff',
        isActive: true,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    ]);

    const token = generateToken({
      id: staff._id.toString(),
      role: 'staff',
      email: staff.email,
      sessionId: session._id.toString(),
    });

    setAuthCookie(res, token);
    const tSessionDuration = performance.now() - tSessionStart;
    console.log(`[AUTH TIMING] [POST /api/auth/staff/google] JWT/session generation completed in ${tSessionDuration.toFixed(1)}ms`);

    const totalDuration = performance.now() - tRequestReceived;
    console.log(`[AUTH TIMING] [POST /api/auth/staff/google] Final HTTP response sent: SUCCESS (200) | Total elapsed: ${totalDuration.toFixed(1)}ms`);

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
    const totalDuration = performance.now() - tRequestReceived;
    console.error(`[AUTH TIMING] [POST /api/auth/staff/google] Request failed after ${totalDuration.toFixed(1)}ms:`, error.message);
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
