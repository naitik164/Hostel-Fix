const { Complaint } = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const Notification = require('../models/Notification');
const Staff = require('../models/Staff');
const {
  processUploadedFiles,
  processUploadedImages,
  cleanupUploadedImages,
} = require('../middleware/upload');

// Standard SLA response times in hours by priority
const SLA_HOURS = {
  Urgent: 12,
  High: 24,
  Medium: 48,
  Low: 72,
};

/**
 * Staff Dashboard Statistics & Summary
 * GET /api/staff/dashboard
 */
const getStaffDashboard = async (req, res, next) => {
  try {
    const staffId = req.user._id;

    const [
      totalAssigned,
      newAssignments,
      accepted,
      inProgress,
      pendingVerification,
      reworkRequired,
      completed,
      unableToComplete,
      recentTasks,
    ] = await Promise.all([
      Complaint.countDocuments({ assignedStaffId: staffId }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'Assigned' }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'Accepted' }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'In Progress' }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'Pending Verification' }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'Rework Required' }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'Resolved' }),
      Complaint.countDocuments({ assignedStaffId: staffId, status: 'Unable to Complete' }),
      Complaint.find({ assignedStaffId: staffId })
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate('studentId', 'name roomNumber hostelBlock'),
    ]);

    // Calculate overdue & high priority
    const activeTasks = await Complaint.find({
      assignedStaffId: staffId,
      status: { $in: ['Assigned', 'Accepted', 'In Progress', 'Rework Required'] },
    }).select('priority createdAt referenceId');

    const now = new Date();
    let overdueCount = 0;
    let highPriorityCount = 0;

    activeTasks.forEach((task) => {
      if (task.priority === 'Urgent' || task.priority === 'High') {
        highPriorityCount++;
      }
      const allowedHours = SLA_HOURS[task.priority] || 48;
      const ageHours = (now - new Date(task.createdAt)) / (1000 * 60 * 60);
      if (ageHours > allowedHours) {
        overdueCount++;
      }
    });

    // Recent activity log for this staff's tasks
    const myTaskIds = await Complaint.find({ assignedStaffId: staffId }).distinct('_id');
    const recentActivity = await ComplaintHistory.find({
      complaintId: { $in: myTaskIds },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('complaintId', 'referenceId title status');

    return res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        newAssignments,
        accepted,
        inProgress,
        pendingVerification,
        reworkRequired,
        completed,
        unableToComplete,
        highPriorityCount,
        overdueCount,
      },
      recentTasks,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Tasks Assigned to Authenticated Staff
 * GET /api/staff/tasks
 */
const getStaffTasks = async (req, res, next) => {
  try {
    const staffId = req.user._id;
    const {
      status,
      category,
      priority,
      hostelBlock,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { assignedStaffId: staffId };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (hostelBlock && hostelBlock !== 'all') {
      query.hostelBlockName = hostelBlock;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { referenceId: searchRegex },
        { title: searchRegex },
        { roomNumber: searchRegex },
        { location: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [total, tasks] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('studentId', 'name email phone hostelBlock roomNumber profilePhoto')
        .populate('assignedBy', 'name email'),
    ]);

    return res.status(200).json({
      success: true,
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Task Details (Strict Staff Task Ownership)
 * GET /api/staff/tasks/:id
 */
const getStaffTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;

    const task = await Complaint.findById(id)
      .populate('studentId', 'name email phone hostelBlock roomNumber profilePhoto')
      .populate('assignedBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    // Strict staff task ownership enforcement
    if (!task.assignedStaffId || task.assignedStaffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are only authorized to view tasks assigned directly to your staff account.',
      });
    }

    const history = await ComplaintHistory.find({ complaintId: task._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      task,
      history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Assigned Task
 * PATCH /api/staff/tasks/:id/accept
 */
const acceptTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;

    const task = await Complaint.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!task.assignedStaffId || task.assignedStaffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot accept a task assigned to another staff member.',
      });
    }

    if (task.status !== 'Assigned') {
      return res.status(400).json({
        success: false,
        message: `Task cannot be accepted from current status "${task.status}". Expected status "Assigned".`,
      });
    }

    task.status = 'Accepted';
    task.acceptedAt = new Date();
    await task.save();

    await ComplaintHistory.create({
      complaintId: task._id,
      actionType: 'TaskAccepted',
      oldValue: 'Assigned',
      newValue: 'Accepted',
      publicNote: `Staff member ${req.user.name} accepted the task.`,
      internalNote: req.body.note ? req.body.note.trim() : '',
      performedBy: req.user._id,
      performedByModel: 'Staff',
      performedByName: req.user.name,
      performedByRole: 'staff',
    });

    // Notify student
    await Notification.create({
      recipientId: task.studentId,
      recipientRole: 'student',
      complaintId: task._id,
      title: 'Staff Accepted Task',
      message: `Staff member ${req.user.name} (${req.user.specialization}) has accepted your complaint ${task.referenceId}.`,
      type: 'info',
      link: `/student/complaints/${task._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Task accepted successfully.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start Work on Task
 * PATCH /api/staff/tasks/:id/start
 */
const startWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;

    const task = await Complaint.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!task.assignedStaffId || task.assignedStaffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot start work on a task assigned to another staff member.',
      });
    }

    if (!['Accepted', 'Rework Required'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Work can only be started when status is "Accepted" or "Rework Required". Current status is "${task.status}".`,
      });
    }

    const oldStatus = task.status;
    task.status = 'In Progress';
    task.startedAt = new Date();
    await task.save();

    await ComplaintHistory.create({
      complaintId: task._id,
      actionType: 'WorkStarted',
      oldValue: oldStatus,
      newValue: 'In Progress',
      publicNote: `Staff member ${req.user.name} started work on site.`,
      internalNote: req.body.notes ? req.body.notes.trim() : '',
      performedBy: req.user._id,
      performedByModel: 'Staff',
      performedByName: req.user.name,
      performedByRole: 'staff',
    });

    // Notify student
    await Notification.create({
      recipientId: task.studentId,
      recipientRole: 'student',
      complaintId: task._id,
      title: 'Work In Progress',
      message: `Staff member ${req.user.name} has started maintenance work for ${task.referenceId}.`,
      type: 'info',
      link: `/student/complaints/${task._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Work status updated to In Progress.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Photo Evidence
 * POST /api/staff/tasks/:id/evidence
 */
const uploadEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;

    const task = await Complaint.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!task.assignedStaffId || task.assignedStaffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot upload evidence to a task assigned to another staff member.',
      });
    }

    if (!['Accepted', 'In Progress', 'Rework Required'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload evidence when task status is "${task.status}". Must be Accepted, In Progress, or Rework Required.`,
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one photo to upload.',
      });
    }

    const evidenceType = req.body.evidenceType || 'staff_after';
    const caption = req.body.caption ? req.body.caption.trim() : '';
    const currentRound = (task.reworkCount || 0) + 1;

    // Normalize evidence category to prompt specification
    let normalizedCategory = 'staff_after';
    if (['staff_before', 'before'].includes(evidenceType)) {
      normalizedCategory = 'staff_before';
    } else if (['staff_additional_evidence', 'additional'].includes(evidenceType)) {
      normalizedCategory = 'staff_additional_evidence';
    } else {
      normalizedCategory = 'staff_after';
    }

    let uploadedImages = [];
    try {
      uploadedImages = await processUploadedImages(req.files, {
        category: normalizedCategory,
        folder: 'hostelfix/evidence',
        prefix: 'staff',
      });
    } catch (uploadErr) {
      return res.status(400).json({
        success: false,
        message: uploadErr.message || 'Failed to process evidence photos.',
      });
    }

    const newEvidenceItems = [];
    uploadedImages.forEach((img) => {
      const evidenceItem = {
        evidenceType: normalizedCategory,
        imageUrl: img.imageUrl,
        publicId: img.publicId,
        storage: img.storage,
        caption,
        uploadedBy: staffId,
        uploadedByName: req.user.name,
        uploadedAt: new Date(),
        submissionRound: currentRound,
      };
      task.evidence.push(evidenceItem);
      newEvidenceItems.push(evidenceItem);
    });

    try {
      await task.save();
    } catch (saveErr) {
      await cleanupUploadedImages(uploadedImages);
      throw saveErr;
    }

    await ComplaintHistory.create({
      complaintId: task._id,
      actionType: 'EvidenceUploaded',
      publicNote: `${newEvidenceItems.length} photo(s) (${normalizedCategory}) uploaded by staff ${req.user.name}.`,
      internalNote: caption,
      performedBy: req.user._id,
      performedByModel: 'Staff',
      performedByName: req.user.name,
      performedByRole: 'staff',
    });

    return res.status(200).json({
      success: true,
      message: `${newEvidenceItems.length} photo(s) uploaded successfully.`,
      evidence: task.evidence,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Task for Warden Verification
 * POST /api/staff/tasks/:id/submit-verification
 */
const submitForVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;
    const { completionNotes, reasonForNoBeforePhoto } = req.body;

    const task = await Complaint.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!task.assignedStaffId || task.assignedStaffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot submit verification for another staff member\'s task.',
      });
    }

    if (!['In Progress', 'Rework Required', 'Accepted'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Task cannot be submitted for verification from current status "${task.status}".`,
      });
    }

    if (!completionNotes || !completionNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Completion notes are mandatory. Please provide a brief description of the work completed.',
      });
    }

    // Require at least one valid photo evidence
    const currentRound = (task.reworkCount || 0) + 1;
    const hasPhotoEvidence = task.evidence && task.evidence.length > 0;
    if (!hasPhotoEvidence) {
      return res.status(400).json({
        success: false,
        message: 'At least one photo proof is required before submitting the task for warden verification.',
      });
    }

    // Check if there is evidence for the current submission round
    const currentRoundEvidence = task.evidence.filter(
      (e) => !e.submissionRound || e.submissionRound === currentRound
    );
    if (currentRoundEvidence.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload updated photo proof for this submission round.',
      });
    }

    task.status = 'Pending Verification';
    task.pendingVerificationAt = new Date();
    task.completionNotes = completionNotes.trim();
    if (reasonForNoBeforePhoto) {
      task.reasonForNoBeforePhoto = reasonForNoBeforePhoto.trim();
    }
    await task.save();

    await ComplaintHistory.create({
      complaintId: task._id,
      actionType: 'VerificationSubmitted',
      oldValue: 'In Progress',
      newValue: 'Pending Verification',
      publicNote: `Staff member completed work and submitted for verification: "${completionNotes.trim()}"`,
      internalNote: reasonForNoBeforePhoto ? `No before photo reason: ${reasonForNoBeforePhoto.trim()}` : '',
      performedBy: req.user._id,
      performedByModel: 'Staff',
      performedByName: req.user.name,
      performedByRole: 'staff',
    });

    // Notify student
    await Notification.create({
      recipientId: task.studentId,
      recipientRole: 'student',
      complaintId: task._id,
      title: 'Work Completed — Awaiting Verification',
      message: `Work for ${task.referenceId} has been completed by staff and submitted for warden review and sign-off.`,
      type: 'info',
      link: `/student/complaints/${task._id}`,
    });

    // Notify warden
    await Notification.create({
      recipientId: task.assignedBy || task.studentId,
      recipientRole: 'admin',
      complaintId: task._id,
      title: 'Pending Verification Required',
      message: `Staff member ${req.user.name} submitted task ${task.referenceId} for verification.`,
      type: 'warning',
      link: `/admin/verifications`,
    });

    return res.status(200).json({
      success: true,
      message: 'Work proof submitted successfully. Task is now pending warden verification.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report Unable to Complete
 * POST /api/staff/tasks/:id/unable-to-complete
 */
const reportUnableToComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user._id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason must be provided explaining why the task cannot be completed.',
      });
    }

    const task = await Complaint.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!task.assignedStaffId || task.assignedStaffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot report an issue on another staff member\'s task.',
      });
    }

    const oldStatus = task.status;
    task.status = 'Unable to Complete';
    task.unableToCompleteReason = reason.trim();
    task.unableToCompleteAt = new Date();
    await task.save();

    await ComplaintHistory.create({
      complaintId: task._id,
      actionType: 'UnableToComplete',
      oldValue: oldStatus,
      newValue: 'Unable to Complete',
      publicNote: `Staff reported issue preventing completion: "${reason.trim()}"`,
      internalNote: reason.trim(),
      performedBy: req.user._id,
      performedByModel: 'Staff',
      performedByName: req.user.name,
      performedByRole: 'staff',
    });

    // Notify student
    await Notification.create({
      recipientId: task.studentId,
      recipientRole: 'student',
      complaintId: task._id,
      title: 'Maintenance Issue Reported',
      message: `Staff encountered an impediment for ${task.referenceId}. Warden has been notified to reassign or provide parts.`,
      type: 'warning',
      link: `/student/complaints/${task._id}`,
    });

    // Notify warden
    await Notification.create({
      recipientId: task.assignedBy || task.studentId,
      recipientRole: 'admin',
      complaintId: task._id,
      title: 'Staff Unable to Complete Task',
      message: `Staff ${req.user.name} reported unable to complete ${task.referenceId}: "${reason.trim()}"`,
      type: 'warning',
      link: `/admin/complaints/${task._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated. Warden has been notified of the impediment.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Staff Notifications
 * GET /api/staff/notifications
 */
const getStaffNotifications = async (req, res, next) => {
  try {
    const staffId = req.user._id;
    const notifications = await Notification.find({
      $or: [{ recipientId: staffId }, { recipientRole: 'staff' }],
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      $or: [{ recipientId: staffId }, { recipientRole: 'staff' }],
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Staff Notification Read
 * PATCH /api/staff/notifications/:id/read
 */
const markStaffNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current Staff Profile & Stats
 * GET /api/staff/profile
 */
const getStaffProfile = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.user._id).select('-__v');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff profile not found.' });
    }

    const completedCount = await Complaint.countDocuments({
      assignedStaffId: staff._id,
      status: 'Resolved',
    });

    const activeCount = await Complaint.countDocuments({
      assignedStaffId: staff._id,
      status: { $in: ['Assigned', 'Accepted', 'In Progress', 'Rework Required', 'Pending Verification'] },
    });

    return res.status(200).json({
      success: true,
      staff: {
        ...staff.toObject(),
        completedCount,
        activeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffDashboard,
  getStaffTasks,
  getStaffTaskById,
  acceptTask,
  startWork,
  uploadEvidence,
  submitForVerification,
  reportUnableToComplete,
  getStaffNotifications,
  markStaffNotificationRead,
  getStaffProfile,
};
