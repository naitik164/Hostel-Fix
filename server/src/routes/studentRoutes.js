const express = require('express');
const authenticate = require('../middleware/auth');
const { requireProfileComplete } = authenticate;
const { requireStudent } = require('../middleware/roles');
const { upload } = require('../middleware/upload');
const {
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
} = require('../controllers/studentController');

const router = express.Router();

// All student routes require authentication and student role
router.use(authenticate, requireStudent);

// --- Onboarding Endpoints (Permitted before profile completion) ---
router.get('/blocks', getStudentHostelBlocks);
router.post('/onboarding', completeOnboarding);

// --- Mandatory Profile Complete Protected Endpoints ---
router.get('/dashboard', requireProfileComplete, getStudentDashboard);
router.get('/complaints', requireProfileComplete, getStudentComplaints);
router.post('/complaints', requireProfileComplete, upload.array('images', 4), submitComplaint);
router.get('/complaints/:id', requireProfileComplete, getStudentComplaintById);
router.post('/complaints/:id/feedback', requireProfileComplete, submitComplaintFeedback);
router.get('/notifications', requireProfileComplete, getStudentNotifications);
router.patch('/notifications/:id/read', requireProfileComplete, markNotificationRead);
router.patch('/notifications/read-all', requireProfileComplete, markAllNotificationsRead);
router.patch('/profile', requireProfileComplete, updateStudentProfile);

module.exports = router;
