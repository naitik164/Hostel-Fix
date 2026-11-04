const express = require('express');
const authenticate = require('../middleware/auth');
const { requireStaff } = require('../middleware/roles');
const { upload } = require('../middleware/upload');
const {
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
} = require('../controllers/staffController');

const router = express.Router();

// All staff routes require authenticated staff account
router.use(authenticate, requireStaff);

// Dashboard & Task listings
router.get('/dashboard', getStaffDashboard);
router.get('/tasks', getStaffTasks);
router.get('/tasks/:id', getStaffTaskById);

// Task Actions
router.patch('/tasks/:id/accept', acceptTask);
router.patch('/tasks/:id/start', startWork);
router.post('/tasks/:id/evidence', upload.array('images', 4), uploadEvidence);
router.post('/tasks/:id/submit-verification', submitForVerification);
router.post('/tasks/:id/unable-to-complete', reportUnableToComplete);

// Notifications & Profile
router.get('/notifications', getStaffNotifications);
router.patch('/notifications/:id/read', markStaffNotificationRead);
router.get('/profile', getStaffProfile);

module.exports = router;
