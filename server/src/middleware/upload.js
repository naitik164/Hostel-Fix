const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Ensure uploads directory exists for local disk fallback
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage allows inspecting buffer and streaming to either Cloudinary or Disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, and GIF images are permitted.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4, // Max 4 files
  },
  fileFilter,
});

/**
 * Process uploaded files: Upload to Cloudinary if keys configured, or save to disk.
 * Returns array of image URLs.
 */
const processUploadedFiles = async (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  const imageUrls = [];

  for (const file of files) {
    if (isCloudinaryConfigured()) {
      // Upload stream to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'hostelfix_complaints',
            transformation: [{ width: 1280, height: 1280, crop: 'limit' }, { quality: 'auto' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      imageUrls.push(uploadResult.secure_url);
    } else {
      // Local disk fallback
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      imageUrls.push(`/uploads/${filename}`);
    }
  }

  return imageUrls;
};

module.exports = {
  upload,
  processUploadedFiles,
};
