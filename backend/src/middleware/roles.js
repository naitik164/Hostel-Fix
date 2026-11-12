const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student authorization required.',
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Warden administrative privileges required.',
    });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff authorization required.',
    });
  }
  next();
};

module.exports = {
  requireStudent,
  requireAdmin,
  requireStaff,
};
