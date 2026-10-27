const mongoose = require('mongoose');

const complaintHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'Created',
        'StatusChange',
        'PriorityChange',
        'StaffAssigned',
        'StaffReassigned',
        'NoteAdded',
        'Reopened',
        'Rejected',
        'FeedbackSubmitted',
      ],
      index: true,
    },
    oldValue: {
      type: String,
      default: '',
    },
    newValue: {
      type: String,
      default: '',
    },
    publicNote: {
      type: String,
      default: '',
    },
    internalNote: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'performedByModel',
    },
    performedByModel: {
      type: String,
      enum: ['Admin', 'User'],
      default: 'Admin',
    },
    performedByName: {
      type: String,
      default: 'System',
    },
    performedByRole: {
      type: String,
      enum: ['admin', 'student', 'system'],
      default: 'admin',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

complaintHistorySchema.index({ complaintId: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintHistory', complaintHistorySchema);
