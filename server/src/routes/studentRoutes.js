const express = require('express');
const authenticate = require('../middleware/auth');
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
} = require('../controllers/studentController');

const router = express.Router();

// All student routes require authentication and student role
router.use(authenticate, requireStudent);

router.get('/dashboard', getStudentDashboard);
router.get('/complaints', getStudentComplaints);
router.post('/complaints', upload.array('images', 4), submitComplaint);
router.get('/complaints/:id', getStudentComplaintById);
router.post('/complaints/:id/feedback', submitComplaintFeedback);
router.get('/notifications', getStudentNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/profile', updateStudentProfile);

module.exports = router;
