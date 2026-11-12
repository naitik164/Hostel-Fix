const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff member name is required'],
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Staff Google email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    googleSub: {
      type: String,
      sparse: true,
      index: true,
      default: null,
    },
    role: {
      type: String,
      default: 'staff',
      enum: ['staff'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: [
        'Electrical',
        'Plumbing',
        'Carpentry',
        'Cleaning & Hygiene',
        'Mess & Food',
        'Internet & IT',
        'Security',
        'General Maintenance',
      ],
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    assignedBlocks: {
      type: [String],
      default: [],
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    lastLoginAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Staff', staffSchema);
