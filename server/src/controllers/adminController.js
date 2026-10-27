const mongoose = require('mongoose');
const { Complaint } = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Staff = require('../models/Staff');
const HostelBlock = require('../models/HostelBlock');
const Setting = require('../models/Setting');
const { sanitizeForCsv } = require('../utils/sanitize');

// Default SLA thresholds in hours
const SLA_HOURS = {
  Critical: 6,
  High: 24,
  Medium: 48,
  Low: 72,
};

/**
 * Get Admin Dashboard Overview Metrics
 * GET /api/admin/dashboard
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      total,
      submittedCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      rejectedCount,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Submitted' }),
      Complaint.countDocuments({ status: 'Assigned' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' }),
    ]);

    const awaitingReview = submittedCount;
    const inProgressTotal = assignedCount + inProgressCount;

    // Calculate average resolution time for resolved complaints
    const resolutionStats = await Complaint.aggregate([
      {
        $match: {
          status: 'Resolved',
          resolvedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          durationHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$durationHours' },
        },
      },
    ]);

    const avgResolutionTimeHours =
      resolutionStats.length > 0 && resolutionStats[0].avgDuration
        ? Number(resolutionStats[0].avgDuration.toFixed(1))
        : 0;

    // Calculate overdue complaints based on SLA thresholds
    const now = new Date();
    const unresolvedComplaints = await Complaint.find({
      status: { $nin: ['Resolved', 'Rejected'] },
    }).select('priority createdAt');

    let overdueCount = 0;
    unresolvedComplaints.forEach((c) => {
      const allowedHours = SLA_HOURS[c.priority] || 48;
      const ageHours = (now - new Date(c.createdAt)) / (1000 * 60 * 60);
      if (ageHours > allowedHours) {
        overdueCount++;
      }
    });

    // Recent 8 complaints for quick overview table
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('studentId', 'name email hostelBlock roomNumber')
      .populate('assignedStaffId', 'name specialization phone');

    return res.status(200).json({
      success: true,
      metrics: {
        total,
        awaitingReview,
        inProgress: inProgressTotal,
        resolved: resolvedCount,
        rejected: rejectedCount,
        overdue: overdueCount,
        avgResolutionTimeHours,
        resolutionRate: total > 0 ? Number(((resolvedCount / total) * 100).toFixed(1)) : 0,
      },
      recentComplaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Complaints for Admin with Comprehensive Filters, Sorting & Pagination
 * GET /api/admin/complaints
 */
const getAdminComplaints = async (req, res, next) => {
  try {
    const {
      status,
      category,
      hostelBlock,
      priority,
      assignedStaff,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (hostelBlock && hostelBlock !== 'all') {
      query.hostelBlockName = hostelBlock;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (assignedStaff && assignedStaff !== 'all') {
      if (assignedStaff === 'unassigned') {
        query.assignedStaffId = { $in: [null, undefined] };
      } else {
        query.assignedStaffId = assignedStaff;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
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

    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('studentId', 'name email phone hostelBlock roomNumber profilePhoto')
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
 * Get Single Complaint Details (Admin View)
 * GET /api/admin/complaints/:id
 */
const getAdminComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate('studentId', 'name email phone hostelBlock roomNumber profilePhoto')
      .populate('assignedStaffId', 'name specialization phone employeeId')
      .populate('hostelBlockId');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Load entire history including internal administrative notes
    const history = await ComplaintHistory.find({ complaintId: complaint._id }).sort({
      createdAt: 1,
    });

    // Load student feedback if exists
    const feedback = await Feedback.findOne({ complaintId: complaint._id });

    // Load all active staff list for assignment dropdown
    const staffList = await Staff.find({ isActive: true }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      complaint,
      history,
      feedback,
      staffList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Complaint Status
 * PATCH /api/admin/complaints/:id/status
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus, publicNote, internalNote, resolutionNotes, rejectedReason } = req.body;

    const validStatuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const oldStatus = complaint.status;

    // Reject requires explanation
    if (newStatus === 'Rejected' && !rejectedReason && !publicNote) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required so the student knows why the complaint was rejected.',
      });
    }

    complaint.status = newStatus;

    if (newStatus === 'Resolved') {
      complaint.resolvedAt = new Date();
      if (resolutionNotes) complaint.resolutionNotes = resolutionNotes.trim();
    } else if (newStatus === 'In Progress' && oldStatus === 'Resolved') {
      // Reopening complaint
      complaint.resolvedAt = null;
    }

    if (newStatus === 'Rejected') {
      complaint.rejectedReason = rejectedReason || publicNote;
    }

    await complaint.save();

    // Log history
    const actionType =
      newStatus === 'Rejected'
        ? 'Rejected'
        : oldStatus === 'Resolved' && newStatus === 'In Progress'
        ? 'Reopened'
        : 'StatusChange';

    await ComplaintHistory.create({
      complaintId: complaint._id,
      actionType,
      oldValue: oldStatus,
      newValue: newStatus,
      publicNote: publicNote || (newStatus === 'Resolved' ? resolutionNotes : rejectedReason) || `Status updated to ${newStatus}`,
      internalNote: internalNote || '',
      performedBy: req.user._id,
      performedByModel: 'Admin',
      performedByName: req.user.name,
      performedByRole: 'admin',
    });

    // Notify student
    await Notification.create({
      recipientId: complaint.studentId,
      recipientRole: 'student',
      complaintId: complaint._id,
      title: `Complaint Status: ${newStatus}`,
      message: `Your complaint ${complaint.referenceId} has been updated to "${newStatus}". ${
        publicNote || resolutionNotes || rejectedReason || ''
      }`.trim(),
      type: newStatus === 'Resolved' ? 'success' : newStatus === 'Rejected' ? 'warning' : 'info',
      link: `/student/complaints/${complaint._id}`,
    });

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${newStatus}.`,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Complaint Priority
 * PATCH /api/admin/complaints/:id/priority
 */
const updateComplaintPriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority: newPriority, priorityReason } = req.body;

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(newPriority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const oldPriority = complaint.priority;
    complaint.priority = newPriority;
    complaint.priorityReason = priorityReason || `Warden updated priority from ${oldPriority} to ${newPriority}`;
    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      actionType: 'PriorityChange',
      oldValue: oldPriority,
      newValue: newPriority,
      publicNote: `Priority escalated/adjusted to ${newPriority}.`,
      internalNote: priorityReason || '',
      performedBy: req.user._id,
      performedByModel: 'Admin',
      performedByName: req.user.name,
      performedByRole: 'admin',
    });

    return res.status(200).json({
      success: true,
      message: `Priority updated to ${newPriority}.`,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign or Reassign Staff to Complaint
 * PATCH /api/admin/complaints/:id/assignment
 */
const updateComplaintAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId, note } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    const isReassignment = Boolean(complaint.assignedStaffId);
    complaint.assignedStaffId = staff._id;
    complaint.assignedAt = new Date();

    // Auto update status if currently Submitted
    if (complaint.status === 'Submitted') {
      complaint.status = 'Assigned';
    }

    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      actionType: isReassignment ? 'StaffReassigned' : 'StaffAssigned',
      newValue: staff.name,
      publicNote: `Assigned to ${staff.name} (${staff.specialization}).`,
      internalNote: note || '',
      performedBy: req.user._id,
      performedByModel: 'Admin',
      performedByName: req.user.name,
      performedByRole: 'admin',
    });

    // Notify student
    await Notification.create({
      recipientId: complaint.studentId,
      recipientRole: 'student',
      complaintId: complaint._id,
      title: 'Staff Assigned to Complaint',
      message: `Maintenance technician ${staff.name} (${staff.specialization}) has been assigned to inspect reference ${complaint.referenceId}.`,
      type: 'info',
      link: `/student/complaints/${complaint._id}`,
    });

    return res.status(200).json({
      success: true,
      message: `Assigned to ${staff.name} successfully.`,
      complaint,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Progress Update or Internal Admin Note
 * POST /api/admin/complaints/:id/notes
 */
const addComplaintNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publicNote, internalNote } = req.body;

    if (!publicNote && !internalNote) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a public note or an internal note.',
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const historyItem = await ComplaintHistory.create({
      complaintId: complaint._id,
      actionType: 'NoteAdded',
      publicNote: publicNote ? publicNote.trim() : '',
      internalNote: internalNote ? internalNote.trim() : '',
      performedBy: req.user._id,
      performedByModel: 'Admin',
      performedByName: req.user.name,
      performedByRole: 'admin',
    });

    if (publicNote) {
      await Notification.create({
        recipientId: complaint.studentId,
        recipientRole: 'student',
        complaintId: complaint._id,
        title: 'Warden Update on Complaint',
        message: `New update on ${complaint.referenceId}: "${publicNote.trim()}"`,
        type: 'info',
        link: `/student/complaints/${complaint._id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note recorded successfully.',
      historyItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real MongoDB Aggregation Analytics Pipeline
 * GET /api/admin/analytics
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    const { hostelBlock, category, status, days = 30 } = req.query;

    const matchStage = {};

    if (hostelBlock && hostelBlock !== 'all') {
      matchStage.hostelBlockName = hostelBlock;
    }
    if (category && category !== 'all') {
      matchStage.category = category;
    }
    if (status && status !== 'all') {
      matchStage.status = status;
    }

    if (days && days !== 'all') {
      const daysCount = parseInt(days, 10) || 30;
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - daysCount);
      matchStage.createdAt = { $gte: sinceDate };
    }

    // 1. Complaints by Status (Doughnut)
    const byStatus = await Complaint.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 2. Complaints by Category (Bar)
    const byCategory = await Complaint.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 3. Complaints by Hostel Block (Bar)
    const byBlock = await Complaint.aggregate([
      { $match: matchStage },
      { $group: { _id: '$hostelBlockName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 4. Complaints Over Time (Line)
    const overTime = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 5. Average Resolution Time by Category in hours (Bar)
    const avgResTimeByCategory = await Complaint.aggregate([
      {
        $match: {
          ...matchStage,
          status: 'Resolved',
          resolvedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          category: 1,
          durationHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: '$category',
          avgHours: { $avg: '$durationHours' },
          resolvedCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          avgHours: { $round: ['$avgHours', 1] },
          resolvedCount: 1,
        },
      },
      { $sort: { avgHours: -1 } },
    ]);

    // 6. Unresolved Complaints by Hostel Block (Horizontal Bar)
    const unresolvedByBlock = await Complaint.aggregate([
      {
        $match: {
          ...matchStage,
          status: { $in: ['Submitted', 'Assigned', 'In Progress'] },
        },
      },
      { $group: { _id: '$hostelBlockName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 7. Staff Workload (Active assigned complaints per staff)
    const staffWorkload = await Staff.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'complaints',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$assignedStaffId', '$$staffId'] },
                    { $in: ['$status', ['Assigned', 'In Progress']] },
                  ],
                },
              },
            },
          ],
          as: 'activeComplaints',
        },
      },
      {
        $project: {
          name: 1,
          specialization: 1,
          activeCount: { $size: '$activeComplaints' },
        },
      },
      { $sort: { activeCount: -1 } },
    ]);

    // KPI Metrics calculation
    const totalComplaints = await Complaint.countDocuments(matchStage);
    const resolvedComplaints = await Complaint.countDocuments({
      ...matchStage,
      status: 'Resolved',
    });
    const resolutionRate =
      totalComplaints > 0 ? Number(((resolvedComplaints / totalComplaints) * 100).toFixed(1)) : 0;

    // SLA Compliance rate: Resolved within SLA
    const resolvedWithinSLA = await Complaint.aggregate([
      {
        $match: {
          ...matchStage,
          status: 'Resolved',
          resolvedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          priority: 1,
          durationHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
    ]);

    let compliantCount = 0;
    resolvedWithinSLA.forEach((item) => {
      const allowed = SLA_HOURS[item.priority] || 48;
      if (item.durationHours <= allowed) {
        compliantCount++;
      }
    });

    const slaComplianceRate =
      resolvedWithinSLA.length > 0
        ? Number(((compliantCount / resolvedWithinSLA.length) * 100).toFixed(1))
        : 100;

    // Overall Average Resolution Time
    const overallAvgHours =
      resolvedWithinSLA.length > 0
        ? Number(
            (
              resolvedWithinSLA.reduce((acc, c) => acc + c.durationHours, 0) /
              resolvedWithinSLA.length
            ).toFixed(1)
          )
        : 0;

    // Overdue count among current unresolved
    const now = new Date();
    const activeUnresolved = await Complaint.find({
      ...matchStage,
      status: { $nin: ['Resolved', 'Rejected'] },
    }).select('priority createdAt');

    let overdueCount = 0;
    activeUnresolved.forEach((c) => {
      const allowed = SLA_HOURS[c.priority] || 48;
      const ageHours = (now - new Date(c.createdAt)) / (1000 * 60 * 60);
      if (ageHours > allowed) {
        overdueCount++;
      }
    });

    return res.status(200).json({
      success: true,
      kpis: {
        totalComplaints,
        resolutionRate,
        overallAvgHours,
        slaComplianceRate,
        overdueCount,
        mostFrequentCategory: byCategory.length > 0 ? byCategory[0]._id : 'N/A',
        mostAffectedBlock: byBlock.length > 0 ? byBlock[0]._id : 'N/A',
      },
      charts: {
        byStatus,
        byCategory,
        byBlock,
        overTime,
        avgResTimeByCategory,
        unresolvedByBlock,
        staffWorkload,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Filtered Complaints to CSV with Formula Injection Prevention
 * GET /api/admin/reports/export
 */
const exportComplaintsCsv = async (req, res, next) => {
  try {
    const { status, category, hostelBlock, priority, startDate, endDate } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (hostelBlock && hostelBlock !== 'all') query.hostelBlockName = hostelBlock;
    if (priority && priority !== 'all') query.priority = priority;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email hostelBlock roomNumber')
      .populate('assignedStaffId', 'name specialization employeeId');

    const headers = [
      'Reference ID',
      'Title',
      'Category',
      'Subcategory',
      'Priority',
      'Status',
      'Hostel Block',
      'Room Number',
      'Location',
      'Student Name',
      'Student Email',
      'Assigned Staff',
      'Staff Specialization',
      'Submitted Date',
      'Resolved Date',
      'Resolution Notes',
      'Rejected Reason',
    ];

    const rows = complaints.map((c) => [
      sanitizeForCsv(c.referenceId),
      sanitizeForCsv(c.title),
      sanitizeForCsv(c.category),
      sanitizeForCsv(c.subcategory),
      sanitizeForCsv(c.priority),
      sanitizeForCsv(c.status),
      sanitizeForCsv(c.hostelBlockName),
      sanitizeForCsv(c.roomNumber),
      sanitizeForCsv(c.location),
      sanitizeForCsv(c.studentId ? c.studentId.name : ''),
      sanitizeForCsv(c.studentId ? c.studentId.email : ''),
      sanitizeForCsv(c.assignedStaffId ? c.assignedStaffId.name : 'Unassigned'),
      sanitizeForCsv(c.assignedStaffId ? c.assignedStaffId.specialization : ''),
      sanitizeForCsv(new Date(c.createdAt).toLocaleString()),
      sanitizeForCsv(c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : ''),
      sanitizeForCsv(c.resolutionNotes),
      sanitizeForCsv(c.rejectedReason),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const filename = `HostelFix_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Students Directory
 * GET /api/admin/students
 */
const getAdminStudents = async (req, res, next) => {
  try {
    const { search, block, page = 1, limit = 20 } = req.query;
    const query = { role: 'student' };

    if (block && block !== 'all') {
      query.hostelBlock = block;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { roomNumber: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, students] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    // Attach complaint counts for each student
    const studentIds = students.map((s) => s._id);
    const complaintCounts = await Complaint.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', total: { $sum: 1 } } },
    ]);

    const countMap = {};
    complaintCounts.forEach((c) => {
      countMap[c._id.toString()] = c.total;
    });

    const studentsWithCounts = students.map((s) => ({
      ...s.toObject(),
      complaintsCount: countMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      students: studentsWithCounts,
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
 * Toggle Student Active Status
 * PATCH /api/admin/students/:id/status
 */
const toggleStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    student.isActive = !student.isActive;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student account ${student.isActive ? 'activated' : 'deactivated'}.`,
      student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Staff CRUD
 */
const getStaffList = async (req, res, next) => {
  try {
    const staff = await Staff.find().sort({ name: 1 });

    // Calculate active assigned complaints for each staff
    const activeComplaints = await Complaint.aggregate([
      { $match: { status: { $in: ['Assigned', 'In Progress'] } } },
      { $group: { _id: '$assignedStaffId', activeWorkload: { $sum: 1 } } },
    ]);

    const workloadMap = {};
    activeComplaints.forEach((item) => {
      if (item._id) workloadMap[item._id.toString()] = item.activeWorkload;
    });

    const staffWithWorkload = staff.map((member) => ({
      ...member.toObject(),
      activeWorkload: workloadMap[member._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      staff: staffWithWorkload,
    });
  } catch (error) {
    next(error);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { name, employeeId, phone, specialization } = req.body;
    if (!name || !employeeId || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Name, employee ID, and specialization are required.',
      });
    }

    const existing = await Staff.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Staff with employee ID "${employeeId}" already exists.`,
      });
    }

    const staff = await Staff.create({
      name: name.trim(),
      employeeId: employeeId.toUpperCase().trim(),
      phone: phone ? phone.trim() : '',
      specialization,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Staff member added successfully.',
      staff,
    });
  } catch (error) {
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, specialization, isActive } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (specialization) staff.specialization = specialization;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: 'Staff updated successfully.',
      staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hostel Block Management
 */
const getBlocks = async (req, res, next) => {
  try {
    const blocks = await HostelBlock.find().sort({ code: 1 });

    // Aggregate complaints count by block name
    const complaintCounts = await Complaint.aggregate([
      { $group: { _id: '$hostelBlockName', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    complaintCounts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const blocksWithCounts = blocks.map((b) => ({
      ...b.toObject(),
      complaintsCount: countMap[b.name] || countMap[b.code] || 0,
    }));

    return res.status(200).json({
      success: true,
      blocks: blocksWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

const createBlock = async (req, res, next) => {
  try {
    const { name, code, description, totalRooms } = req.body;
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Block name and code are required.',
      });
    }

    const existing = await HostelBlock.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Block code "${code}" already exists.`,
      });
    }

    const block = await HostelBlock.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description ? description.trim() : '',
      totalRooms: totalRooms || 60,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Hostel block added successfully.',
      block,
    });
  } catch (error) {
    next(error);
  }
};

const updateBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, totalRooms, isActive } = req.body;

    const block = await HostelBlock.findById(id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Hostel block not found.' });
    }

    if (name) block.name = name.trim();
    if (description !== undefined) block.description = description.trim();
    if (totalRooms !== undefined) block.totalRooms = totalRooms;
    if (isActive !== undefined) block.isActive = isActive;

    await block.save();

    return res.status(200).json({
      success: true,
      message: 'Hostel block updated successfully.',
      block,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBlock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const block = await HostelBlock.findById(id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found.' });
    }

    // Prevent deletion if referenced by existing complaints (Section 11)
    const referencedCount = await Complaint.countDocuments({
      $or: [{ hostelBlockId: block._id }, { hostelBlockName: block.name }],
    });

    if (referencedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete block "${block.name}". There are ${referencedCount} complaints associated with it. Deactivate the block instead.`,
      });
    }

    await HostelBlock.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Block "${block.name}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Notifications
 */
const getAdminNotifications = async (req, res, next) => {
  try {
    const [unreadCount, notifications] = await Promise.all([
      Notification.countDocuments({ recipientRole: 'admin', isRead: false }),
      Notification.find({ recipientRole: 'admin' }).sort({ createdAt: -1 }).limit(40),
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

const markAdminNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const markAllAdminNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipientRole: 'admin', isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: 'All admin notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * System Settings
 */
const getSettings = async (req, res, next) => {
  try {
    const sla = await Setting.findOne({ key: 'sla_hours' });
    return res.status(200).json({
      success: true,
      slaHours: sla ? sla.value : SLA_HOURS,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { slaHours } = req.body;
    if (slaHours) {
      await Setting.findOneAndUpdate(
        { key: 'sla_hours' },
        { key: 'sla_hours', value: slaHours, description: 'SLA target hours per priority' },
        { upsert: true, new: true }
      );
    }
    return res.status(200).json({
      success: true,
      message: 'System settings saved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAdminComplaints,
  getAdminComplaintById,
  updateComplaintStatus,
  updateComplaintPriority,
  updateComplaintAssignment,
  addComplaintNote,
  getAdminAnalytics,
  exportComplaintsCsv,
  getAdminStudents,
  toggleStudentStatus,
  getStaffList,
  createStaff,
  updateStaff,
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getSettings,
  updateSettings,
};
