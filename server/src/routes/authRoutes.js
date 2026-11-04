const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  googleLogin,
  demoStudentLogin,
  staffGoogleLogin,
  demoStaffLogin,
  adminLogin,
  logout,
  getMe,
} = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Rate limiter for authentication attempts (30/15m in production, 500 in dev/test)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 500,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/google', authLimiter, googleLogin);
router.post('/staff/google', authLimiter, staffGoogleLogin);
if (process.env.NODE_ENV !== 'production') {
  router.post('/demo-student-login', authLimiter, demoStudentLogin);
  router.post('/demo-staff-login', authLimiter, demoStaffLogin);
}
router.post('/admin/login', authLimiter, adminLogin);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
