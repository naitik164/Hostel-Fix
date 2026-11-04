const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  cloudinary,
  isCloudinaryConfigured,
  uploadStream,
  deleteImage,
} = require('../config/cloudinary');

// Ensure uploads directory exists for reliable local disk fallback
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage buffers file in memory so we can stream to Cloudinary or write to disk
const storage = multer.memoryStorage();

// Strict mime-type filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file format. Only JPEG, PNG, WEBP, and GIF images are permitted.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Maximum 5 files per submission
  },
  fileFilter,
});

/**
 * Uploads a single file buffer to Cloudinary with automatic local disk fallback.
 *
 * @param {Object} file - Express multer file object with buffer
 * @param {Object} options - { folder, prefix, category }
 * @returns {Promise<Object>} Image record with URL and storage identifier
 */
const uploadSingleImageToStorage = async (file, options = {}) => {
  const category = options.category || 'student_complaint';
  const folder = options.folder || (category === 'student_complaint' ? 'hostelfix/complaints' : 'hostelfix/evidence');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const baseName = `${options.prefix || 'img'}_${timestamp}_${randomSuffix}`;

  // 1. Attempt Cloudinary upload if configured
  if (isCloudinaryConfigured()) {
    try {
      const uploadResult = await uploadStream(file.buffer, {
        folder,
        public_id: baseName,
        tags: ['hostelfix', category],
      });

      return {
        imageUrl: uploadResult.secure_url,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        storage: 'cloudinary',
        category,
        bytes: uploadResult.bytes || file.buffer.length,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        uploadedAt: new Date(),
      };
    } catch (err) {
      console.warn(
        `[Storage] Cloudinary streaming failed (${err.message}); falling back to local disk storage.`
      );
    }
  }

  // 2. Local disk storage fallback
  const filename = `${baseName}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, file.buffer);

  return {
    imageUrl: `/uploads/${filename}`,
    url: `/uploads/${filename}`,
    publicId: filename,
    storage: 'local',
    category,
    bytes: file.buffer.length,
    format: ext.replace('.', ''),
    uploadedAt: new Date(),
  };
};

/**
 * Process multiple uploaded files and return structured image records.
 *
 * @param {Array} files - req.files from multer
 * @param {Object} options - { folder, prefix, category }
 * @returns {Promise<Array<Object>>}
 */
const processUploadedImages = async (files, options = {}) => {
  if (!files || files.length === 0) {
    return [];
  }

  const results = [];
  for (const file of files) {
    const imgRecord = await uploadSingleImageToStorage(file, options);
    results.push(imgRecord);
  }
  return results;
};

/**
 * Backward compatibility helper returning string URLs array.
 *
 * @param {Array} files
 * @param {Object} options
 * @returns {Promise<Array<string>>}
 */
const processUploadedFiles = async (files, options = {}) => {
  const imageRecords = await processUploadedImages(files, options);
  return imageRecords.map((img) => img.imageUrl);
};

/**
 * Cleans up uploaded images if a subsequent database transaction or controller fails.
 * Prevents orphaned images in Cloudinary or on disk.
 *
 * @param {Array<Object>} images - Array of image records { publicId, storage }
 */
const cleanupUploadedImages = async (images = []) => {
  if (!images || !Array.isArray(images)) return;

  for (const img of images) {
    if (!img) continue;
    try {
      if (img.storage === 'cloudinary' && img.publicId) {
        await deleteImage(img.publicId);
      } else if (img.storage === 'local' && img.publicId) {
        const filePath = path.join(uploadsDir, img.publicId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      console.warn('[Storage] Error during cleanup:', err.message);
    }
  }
};

module.exports = {
  upload,
  processUploadedImages,
  processUploadedFiles,
  uploadSingleImageToStorage,
  cleanupUploadedImages,
  uploadsDir,
};
