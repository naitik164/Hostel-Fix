const Session = require('../models/Session');

/**
 * Clean up expired user sessions from the database
 */
const cleanupExpiredSessions = async () => {
  try {
    const result = await Session.deleteMany({ expiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      console.log(`[Cleanup Job] Purged ${result.deletedCount} expired sessions.`);
    }
    return { deletedCount: result.deletedCount };
  } catch (err) {
    console.error('[Cleanup Job Error]:', err.message);
    return { error: err.message };
  }
};

module.exports = {
  cleanupExpiredSessions,
};
