const express = require('express');
const authenticate = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const {
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
  getPendingVerifications,
  verifyComplaint,
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getSettings,
  updateSettings,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/complaints', getAdminComplaints);
router.get('/verifications', getPendingVerifications);
router.get('/complaints/:id', getAdminComplaintById);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.patch('/complaints/:id/priority', updateComplaintPriority);
router.patch('/complaints/:id/assignment', updateComplaintAssignment);
router.patch('/complaints/:id/verification', verifyComplaint);
router.post('/complaints/:id/notes', addComplaintNote);

// Analytics & Reports
router.get('/analytics', getAdminAnalytics);
router.get('/reports/export', exportComplaintsCsv);

// Students Directory
router.get('/students', getAdminStudents);
router.patch('/students/:id/status', toggleStudentStatus);

// Staff Management
router.get('/staff', getStaffList);
router.post('/staff', createStaff);
router.patch('/staff/:id', updateStaff);

// Hostel Blocks
router.get('/blocks', getBlocks);
router.post('/blocks', createBlock);
router.patch('/blocks/:id', updateBlock);
router.delete('/blocks/:id', deleteBlock);

// Notifications
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/:id/read', markAdminNotificationRead);
router.patch('/notifications/read-all', markAllAdminNotificationsRead);

// Settings
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

module.exports = router;
