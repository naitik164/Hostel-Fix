const { Complaint } = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const HostelBlock = require('../models/HostelBlock');
const { generateComplaintReference } = require('../utils/referenceGenerator');
const { suggestPriority } = require('../utils/priorityRules');
const {
  processUploadedFiles,
  processUploadedImages,
  cleanupUploadedImages,
} = require('../middleware/upload');

/**
 * Get Student Dashboard Overview
 * GET /api/student/dashboard
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Counts calculated directly from real records
    const [total, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments({ studentId }),
      Complaint.countDocuments({ studentId, status: { $in: ['Submitted', 'Assigned'] } }),
      Complaint.countDocuments({ studentId, status: 'In Progress' }),
      Complaint.countDocuments({ studentId, status: 'Resolved' }),
    ]);

    // Recent 5 complaints
    const recentComplaints = await Complaint.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedStaffId', 'name specialization phone');

    // Available hostel blocks for forms
    const blocks = await HostelBlock.find({ isActive: true }).sort({ code: 1 });

    return res.status(200).json({
      success: true,
      metrics: {
        total,
        pending,
        inProgress,
        resolved,
      },
      recentComplaints,
      blocks,
    });
  } catch (error) {
    next(error);
  }
};

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * Get All Complaints for Authenticated Student with Filters & Search
 * GET /api/student/complaints
 */
const getStudentComplaints = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { status, category, search, page = 1, limit = 10 } = req.query;

    const query = { studentId };

    if (typeof status === 'string' && status && status !== 'all') {
      query.status = status.trim();
    }

    if (typeof category === 'string' && category && category !== 'all') {
      query.category = category.trim();
    }

    if (typeof search === 'string' && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query.$or = [{ title: searchRegex }, { referenceId: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedStaffId', 'name specialization phone'),
    ]);

    return res.status(200).json({
      success: true,
      complaints,
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
 * Submit New Complaint
 * POST /api/student/complaints
 */
const submitComplaint = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const {
      title,
      category,
      subcategory,
      description,
      hostelBlockName,
      roomNumber,
      location,
      preferredContact,
    } = req.body;

    if (!title || !category || !description || !hostelBlockName) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, description, and hostel block are required fields.',
      });
    }

    // Process image uploads (disk or Cloudinary) with structured metadata
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      try {
        uploadedImages = await processUploadedImages(req.files, {
          category: 'student_complaint',
          folder: 'hostelfix/complaints',
          prefix: 'student',
        });
      } catch (uploadErr) {
        return res.status(400).json({
          success: false,
          message: uploadErr.message || 'Failed to process uploaded photos.',
        });
      }
    }

    const images = uploadedImages.map((img) => img.imageUrl);
    const complaintPhotos = uploadedImages.map((img) => ({
      imageUrl: img.imageUrl,
      publicId: img.publicId,
      storage: img.storage,
      category: 'student_complaint',
      uploadedAt: img.uploadedAt || new Date(),
    }));

    // Find block reference if exists
    const blockDoc = await HostelBlock.findOne({
      $or: [{ name: hostelBlockName }, { code: hostelBlockName }],
    });

    // Concurrency-safe atomic reference ID
    const referenceId = await generateComplaintReference();

    // Server-side priority suggestion
    const prioritySuggestion = suggestPriority(category, title, description);

    let complaint;
    try {
      complaint = await Complaint.create({
        referenceId,
        studentId,
        title: title.trim(),
        category,
        subcategory: subcategory ? subcategory.trim() : '',
        description: description.trim(),
        images,
        complaintPhotos,
        hostelBlockId: blockDoc ? blockDoc._id : null,
        hostelBlockName: blockDoc ? blockDoc.name : hostelBlockName.trim(),
        roomNumber: roomNumber ? roomNumber.trim() : '',
        location: location ? location.trim() : '',
        preferredContact: preferredContact || 'Email',
        priority: prioritySuggestion.priority,
        suggestedPriority: prioritySuggestion.priority,
        priorityReason: prioritySuggestion.reason,
        status: 'Submitted',
      });
    } catch (createErr) {
      // Clean up uploaded files to avoid orphaned storage
      await cleanupUploadedImages(uploadedImages);
      throw createErr;
    }

    // Log in ComplaintHistory
    await ComplaintHistory.create({
      complaintId: complaint._id,
      actionType: 'Created',
      newValue: 'Submitted',
      publicNote: 'Complaint registered and queued for warden review.',
      performedBy: studentId,
      performedByModel: 'User',
      performedByName: req.user.name,
      performedByRole: 'student',
    });

    // Notification for Student
    await Notification.create({
      recipientId: studentId,
      recipientRole: 'student',
      complaintId: complaint._id,
      title: 'Complaint Registered',
      message: `Your complaint "${complaint.title}" has been logged with Reference ID ${complaint.referenceId}.`,
      type: 'success',
      link: `/student/complaints/${complaint._id}`,
    });

    // Notification for Warden(s)
    const isCritical = complaint.priority === 'Critical';
    await Notification.create({
      recipientId: studentId, // Placeholder; recipientRole: 'admin' targets admin views
      recipientRole: 'admin',
      complaintId: complaint._id,
      title: isCritical ? `CRITICAL ALERT: ${complaint.referenceId}` : `New Complaint: ${complaint.referenceId}`,
      message: `New ${complaint.priority} priority complaint in ${complaint.hostelBlockName}: "${complaint.title}"`,
      type: isCritical ? 'critical' : 'info',
      link: `/admin/complaints/${complaint._id}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Complaint Details (Student View)
 * GET /api/student/complaints/:id
 */
const getStudentComplaintById = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate('assignedStaffId', 'name specialization phone')
      .populate('studentId', 'name email profilePhoto hostelBlock roomNumber');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Enforce student ownership
    if (complaint.studentId._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view complaints submitted by your own account.',
      });
    }

    // Load timeline history, omitting internal notes!
    const rawHistory = await ComplaintHistory.find({ complaintId: complaint._id }).sort({
      createdAt: 1,
    });

    const history = rawHistory.map((item) => ({
      _id: item._id,
      actionType: item.actionType,
      oldValue: item.oldValue,
      newValue: item.newValue,
      publicNote: item.publicNote,
      performedByName: item.performedByName,
      performedByRole: item.performedByRole,
      createdAt: item.createdAt,
    }));

    // Check if feedback submitted
    const feedback = await Feedback.findOne({ complaintId: complaint._id });

    return res.status(200).json({
      success: true,
      complaint,
      history,
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Feedback on Resolved Complaint
 * POST /api/student/complaints/:id/feedback
 */
const submitComplaintFeedback = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    if (complaint.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted once the complaint is resolved.',
      });
    }

    // Check if feedback already exists
    let feedback = await Feedback.findOne({ complaintId: complaint._id });
    if (feedback) {
      feedback.rating = rating;
      feedback.comment = comment ? comment.trim() : '';
      await feedback.save();
    } else {
      feedback = await Feedback.create({
        complaintId: complaint._id,
        studentId,
        rating,
        comment: comment ? comment.trim() : '',
      });
    }

    // Log history
    await ComplaintHistory.create({
      complaintId: complaint._id,
      actionType: 'FeedbackSubmitted',
      publicNote: `Student rated resolution: ${rating} / 5 stars.${comment ? ` Feedback: "${comment}"` : ''}`,
      performedBy: studentId,
      performedByModel: 'User',
      performedByName: req.user.name,
      performedByRole: 'student',
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student Notifications
 * GET /api/student/notifications
 */
const getStudentNotifications = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [unreadCount, notifications] = await Promise.all([
      Notification.countDocuments({ recipientId: studentId, recipientRole: 'student', isRead: false }),
      Notification.find({ recipientId: studentId, recipientRole: 'student' }).sort({ createdAt: -1 }).limit(30),
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Single Notification as Read
 * PATCH /api/student/notifications/:id/read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: studentId, recipientRole: 'student' },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark All Student Notifications as Read
 * PATCH /api/student/notifications/read-all
 */
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    await Notification.updateMany({ recipientId: studentId, recipientRole: 'student', isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Active Hostel Blocks for Dropdown Selection
 * GET /api/student/blocks
 */
const getStudentHostelBlocks = async (req, res, next) => {
  try {
    const blocks = await HostelBlock.find({ isActive: true }).sort({ code: 1, name: 1 });
    return res.status(200).json({
      success: true,
      blocks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Mandatory Student Onboarding
 * POST /api/student/onboarding
 */
const completeOnboarding = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const {
      name,
      phone,
      enrollmentNumber,
      gender,
      collegeName = 'LNCTE',
      branch,
      academicYear,
      rollNumber,
      hostelBlock,
      roomNumber,
      hostelAddress = 'LNCTE Campus, Bhopal',
    } = req.body;

    const errors = {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    // Phone validation: Indian 10-digit mobile number starting with 6-9
    const cleanedPhone = phone ? String(phone).replace(/[\s-]/g, '').trim() : '';
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!cleanedPhone || !indianPhoneRegex.test(cleanedPhone)) {
      errors.phone = 'Please provide a valid 10-digit Indian mobile number (e.g., 9876543210).';
    }

    if (!enrollmentNumber || typeof enrollmentNumber !== 'string' || !enrollmentNumber.trim()) {
      errors.enrollmentNumber = 'Enrollment number is mandatory.';
    }

    const validGenders = ['Male', 'Female', 'Other'];
    if (!gender || !validGenders.includes(gender)) {
      errors.gender = 'Please select a valid gender option.';
    }

    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      errors.branch = 'Branch / Department is mandatory.';
    }

    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    if (!academicYear || !validYears.includes(academicYear)) {
      errors.academicYear = 'Please select your current academic year.';
    }

    if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
      errors.rollNumber = 'College roll number is mandatory.';
    }

    if (!hostelBlock || typeof hostelBlock !== 'string' || !hostelBlock.trim()) {
      errors.hostelBlock = 'Hostel block is mandatory.';
    }

    if (!roomNumber || typeof roomNumber !== 'string' || !roomNumber.trim()) {
      errors.roomNumber = 'Room number is mandatory.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory profile fields correctly.',
        errors,
      });
    }

    // Check enrollment number uniqueness against other students
    const cleanEnrollment = enrollmentNumber.trim().toUpperCase();
    const existingEnrollment = await User.findOne({
      enrollmentNumber: cleanEnrollment,
      _id: { $ne: studentId },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'This enrollment number is already registered with another student account.',
        errors: {
          enrollmentNumber: 'Enrollment number already in use.',
        },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      studentId,
      {
        $set: {
          name: name.trim(),
          phone: cleanedPhone,
          enrollmentNumber: cleanEnrollment,
          gender,
          collegeName: (collegeName && collegeName.trim()) || 'LNCTE',
          branch: branch.trim(),
          academicYear,
          rollNumber: rollNumber.trim(),
          hostelBlock: hostelBlock.trim(),
          roomNumber: roomNumber.trim(),
          hostelAddress: (hostelAddress && hostelAddress.trim()) || 'LNCTE Campus, Bhopal',
          profileCompleted: true,
          profileCompletedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student profile onboarding completed successfully.',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        fullName: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        phoneNumber: updatedUser.phone,
        enrollmentNumber: updatedUser.enrollmentNumber,
        gender: updatedUser.gender,
        collegeName: updatedUser.collegeName,
        branch: updatedUser.branch,
        academicYear: updatedUser.academicYear,
        rollNumber: updatedUser.rollNumber,
        hostelBlock: updatedUser.hostelBlock,
        roomNumber: updatedUser.roomNumber,
        hostelAddress: updatedUser.hostelAddress,
        profilePhoto: updatedUser.profilePhoto,
        profileCompleted: true,
        isProfileComplete: true,
        profileCompletedAt: updatedUser.profileCompletedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Student Profile (Hostel Block, Room Number, Phone, Name, etc.)
 * PATCH /api/student/profile
 * Security: Strict allowlist and type validation; prevents privilege escalation or mass-assignment
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const {
      name,
      phone,
      gender,
      collegeName,
      branch,
      academicYear,
      rollNumber,
      hostelBlock,
      roomNumber,
      hostelAddress,
    } = req.body;

    const updateFields = {};
    if (typeof name === 'string' && name.trim()) updateFields.name = name.trim();
    if (typeof hostelBlock === 'string') updateFields.hostelBlock = hostelBlock.trim();
    if (typeof roomNumber === 'string') updateFields.roomNumber = roomNumber.trim();
    if (typeof hostelAddress === 'string') updateFields.hostelAddress = hostelAddress.trim();
    if (typeof branch === 'string') updateFields.branch = branch.trim();
    if (typeof rollNumber === 'string') updateFields.rollNumber = rollNumber.trim();
    if (typeof collegeName === 'string') updateFields.collegeName = collegeName.trim();

    if (typeof gender === 'string') {
      const validGenders = ['Male', 'Female', 'Other'];
      if (validGenders.includes(gender)) updateFields.gender = gender;
    }

    if (typeof academicYear === 'string') {
      const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      if (validYears.includes(academicYear)) updateFields.academicYear = academicYear;
    }

    if (phone !== undefined) {
      const cleanedPhone = String(phone).replace(/[\s-]/g, '').trim();
      const indianPhoneRegex = /^[6-9]\d{9}$/;
      if (cleanedPhone && !indianPhoneRegex.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian mobile number.',
        });
      }
      updateFields.phone = cleanedPhone;
    }

    // Perform atomic update with validators
    const updatedUser = await User.findByIdAndUpdate(
      studentId,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    const isComplete = typeof updatedUser.checkProfileCompleted === 'function'
      ? updatedUser.checkProfileCompleted()
      : Boolean(updatedUser.profileCompleted);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        fullName: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        hostelBlock: updatedUser.hostelBlock,
        roomNumber: updatedUser.roomNumber,
        hostelAddress: updatedUser.hostelAddress,
        phone: updatedUser.phone,
        phoneNumber: updatedUser.phone,
        enrollmentNumber: updatedUser.enrollmentNumber,
        gender: updatedUser.gender,
        collegeName: updatedUser.collegeName,
        branch: updatedUser.branch,
        academicYear: updatedUser.academicYear,
        rollNumber: updatedUser.rollNumber,
        profilePhoto: updatedUser.profilePhoto,
        profileCompleted: isComplete,
        isProfileComplete: isComplete,
        profileCompletedAt: updatedUser.profileCompletedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
  getStudentComplaints,
  submitComplaint,
  getStudentComplaintById,
  submitComplaintFeedback,
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateStudentProfile,
  getStudentHostelBlocks,
  completeOnboarding,
};
