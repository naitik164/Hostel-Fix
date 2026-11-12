const cloudinary = require('cloudinary').v2;

/**
 * Evaluates and configures Cloudinary from environment variables.
 * Supports direct keys (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * as well as standard CLOUDINARY_URL string.
 */
function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (
    cloudName &&
    apiKey &&
    apiSecret &&
    !cloudName.includes('your_') &&
    cloudName.trim().length > 0
  ) {
    return {
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
    };
  }

  if (process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      return {
        cloud_name: url.hostname,
        api_key: url.username,
        api_secret: url.password,
      };
    } catch {
      // Ignore URL parse error
    }
  }

  return null;
}

/**
 * Re-configures Cloudinary on demand.
 */
function initCloudinary() {
  const creds = getCloudinaryCredentials();
  if (creds) {
    cloudinary.config({
      cloud_name: creds.cloud_name,
      api_key: creds.api_key,
      api_secret: creds.api_secret,
      secure: true,
    });
    return true;
  }
  return false;
}

// Initial configuration
const isConfiguredAtStartup = initCloudinary();
if (isConfiguredAtStartup) {
  console.log('[Cloudinary] SDK initialized with cloud name:', process.env.CLOUDINARY_CLOUD_NAME || '(via CLOUDINARY_URL)');
} else {
  console.log('[Storage] Cloudinary credentials not detected; using local storage fallback for uploads.');
}

/**
 * Checks whether Cloudinary has credentials configured in environment.
 */
const isCloudinaryConfigured = () => {
  return initCloudinary();
};

/**
 * Upload a memory buffer stream directly to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - { folder, public_id, transformation, tags }
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary is not configured on the server.'));
    }

    const uploadOptions = {
      folder: options.folder || 'hostelfix',
      public_id: options.public_id,
      overwrite: true,
      resource_type: 'image',
      transformation: options.transformation || [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
      tags: options.tags || ['hostelfix'],
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Safely delete an image from Cloudinary by public ID.
 * @param {string} publicId
 * @returns {Promise<Object>}
 */
const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.warn('[Cloudinary] Failed to delete image:', publicId, err.message);
    return null;
  }
};

/**
 * Ping Cloudinary to test connection and credentials validity.
 * @returns {Promise<{success: boolean, message: string}>}
 */
const pingCloudinary = async () => {
  if (!isCloudinaryConfigured()) {
    return { success: false, message: 'Cloudinary environment variables are missing.' };
  }
  try {
    const res = await cloudinary.api.ping();
    return { success: true, status: res.status || 'ok' };
  } catch (err) {
    return { success: false, message: err.message || 'Cloudinary ping failed.' };
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadStream,
  deleteImage,
  pingCloudinary,
  initCloudinary,
};
