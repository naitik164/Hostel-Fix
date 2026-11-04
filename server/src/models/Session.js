const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'staff'],
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index for automatic expiry cleanup
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for active session lookups
sessionSchema.index({ _id: 1, isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);
