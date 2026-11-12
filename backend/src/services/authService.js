const crypto = require('crypto');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Session = require('../models/Session');
const { verifyGoogleIdToken } = require('../config/passport');
const { generateToken } = require('../utils/jwt');

class AuthService {
  /**
   * Verify Google OAuth credential token
   */
  async verifyGoogleToken(credential) {
    return await verifyGoogleIdToken(credential);
  }

  /**
   * Find existing student or create a new one from Google Profile payload
   */
  async findOrCreateStudent(payload) {
    const { sub: googleId, email, name, picture } = payload;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name,
        avatar: picture,
        role: 'student',
        isOnboarded: false,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    return user;
  }

  /**
   * Create persisted session record with crypto-random session token
   */
  async createSession(userId, role, req = {}) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await Session.create({
      userId,
      userRole: role,
      sessionToken,
      ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      userAgent: req.headers?.['user-agent'] || 'Unknown',
      expiresAt,
    });

    const jwtToken = generateToken({
      id: userId,
      role,
      sessionId: session._id,
      sessionToken,
    });

    return { session, jwtToken };
  }
}

module.exports = new AuthService();
