const mongoose = require('mongoose');

const complaintCategories = [
  'Food Quality & Mess',
  'Drinking Water',
  'Plumbing & Washroom',
  'Electricity & Lighting',
  'Cleanliness & Hygiene',
  'Room Maintenance',
  'Furniture & Fixtures',
  'Internet & Wi-Fi',
  'Security & Safety',
  'Pest Control',
  'Common Area Maintenance',
  'Other',
];

const complaintStatuses = [
  'Submitted',
  'Assigned',
  'Accepted',
  'In Progress',
  'Pending Verification',
  'Rework Required',
  'Resolved',
  'Unable to Complete',
  'Rejected',
];

const complaintPriorities = ['Low', 'Medium', 'High', 'Critical'];

const complaintSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: complaintCategories,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    complaintPhotos: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
        storage: {
          type: String,
          enum: ['cloudinary', 'local'],
          default: 'local',
        },
        category: {
          type: String,
          enum: [
            'student_complaint',
            'staff_before',
            'staff_after',
            'staff_additional_evidence',
          ],
          default: 'student_complaint',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    hostelBlockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelBlock',
      index: true,
    },
    hostelBlockName: {
      type: String,
      required: [true, 'Hostel block is required'],
      index: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    preferredContact: {
      type: String,
      enum: ['Email', 'Phone', 'In-Person'],
      default: 'Email',
    },
    priority: {
      type: String,
      enum: complaintPriorities,
      default: 'Medium',
      index: true,
    },
    suggestedPriority: {
      type: String,
      enum: complaintPriorities,
      default: 'Medium',
    },
    priorityReason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: complaintStatuses,
      default: 'Submitted',
      index: true,
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    assignedByName: {
      type: String,
      default: '',
    },
    assignmentInstructions: {
      type: String,
      default: '',
    },
    acceptedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    pendingVerificationAt: {
      type: Date,
    },
    completionNotes: {
      type: String,
      default: '',
    },
    reasonForNoBeforePhoto: {
      type: String,
      default: '',
    },
    evidence: [
      {
        evidenceType: {
          type: String,
          enum: [
            'before',
            'after',
            'additional',
            'student_complaint',
            'staff_before',
            'staff_after',
            'staff_additional_evidence',
          ],
          required: true,
          default: 'after',
        },
        imageUrl: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
        storage: {
          type: String,
          enum: ['cloudinary', 'local'],
          default: 'local',
        },
        caption: {
          type: String,
          trim: true,
          default: '',
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Staff',
        },
        uploadedByName: {
          type: String,
          default: '',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        submissionRound: {
          type: Number,
          default: 1,
        },
      },
    ],
    reworkReason: {
      type: String,
      default: '',
    },
    reworkCount: {
      type: Number,
      default: 0,
    },
    reworkRequestedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    verifiedByName: {
      type: String,
      default: '',
    },
    unableToCompleteReason: {
      type: String,
      default: '',
    },
    unableToCompleteAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast filtering and analytics queries
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ studentId: 1, createdAt: -1 });
complaintSchema.index({ hostelBlockName: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ priority: 1, status: 1 });

module.exports = {
  Complaint: mongoose.model('Complaint', complaintSchema),
  complaintCategories,
  complaintStatuses,
  complaintPriorities,
};
