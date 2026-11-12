const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    googleSub: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student'],
      default: 'student',
      immutable: true,
    },

    // --- Onboarding & Profile Completion State ---
    profileCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    profileCompletedAt: {
      type: Date,
      default: null,
    },

    // --- Personal Information ---
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
      trim: true,
    },

    // --- Academic Information ---
    collegeName: {
      type: String,
      trim: true,
      default: 'LNCTE',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', ''],
      default: '',
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },

    // --- Hostel Information ---
    hostelBlock: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    hostelAddress: {
      type: String,
      trim: true,
      default: 'LNCTE Campus, Bhopal',
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for API naming consistency
userSchema.virtual('fullName').get(function () {
  return this.name;
});
userSchema.virtual('phoneNumber').get(function () {
  return this.phone;
});

// Helper to determine if student profile is complete (supports backwards compatibility for existing records)
userSchema.methods.checkProfileCompleted = function () {
  if (this.profileCompleted === true) return true;
  // If an existing student record already has hostel block and room number filled out
  if (this.hostelBlock && this.roomNumber && this.phone) {
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
