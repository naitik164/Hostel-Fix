/**
 * Authentication Input Validation Helpers
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const validateStaffLogin = (body) => {
  const errors = [];
  if (!body.email || !validateEmail(body.email)) {
    errors.push('Valid email address is required.');
  }
  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateAdminLogin = (body) => {
  const errors = [];
  if (!body.email || !validateEmail(body.email)) {
    errors.push('Valid admin email address is required.');
  }
  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required.');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateStaffLogin,
  validateAdminLogin,
};
