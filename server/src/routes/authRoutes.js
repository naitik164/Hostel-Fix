const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  googleLogin,
  demoStudentLogin,
  adminLogin,
  logout,
  getMe,
} = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Rate limiter for authentication attempts (Section 16)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/google', authLimiter, googleLogin);
router.post('/demo-student-login', authLimiter, demoStudentLogin);
router.post('/admin/login', authLimiter, adminLogin);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
