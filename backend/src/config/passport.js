const { OAuth2Client } = require('google-auth-library');

/**
 * Google OAuth & Identity Configuration for HostelFix
 */
const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.warn('[Google OAuth Config] GOOGLE_CLIENT_ID is not set in environment.');
  }
  return new OAuth2Client(clientId);
};

/**
 * Verify Google ID Token with Google Identity Services
 * @param {string} idToken - Raw Google ID token
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyGoogleIdToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Client ID is not configured on the server.');
  }

  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  return ticket.getPayload();
};

module.exports = {
  getGoogleClient,
  verifyGoogleIdToken,
};

