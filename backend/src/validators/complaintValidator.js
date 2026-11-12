/**
 * Complaint Input Validation Helpers
 */
const ALLOWED_CATEGORIES = [
  'Food Quality & Mess',
  'Drinking Water',
  'Electricity & Lighting',
  'Plumbing & Washroom',
  'Cleanliness & Hygiene',
  'Furniture & Infrastructure',
  'Internet & WiFi',
  'Security & Safety',
  'Pest Control',
  'Other',
];

const validateCreateComplaint = (body) => {
  const errors = [];

  if (!body.category || typeof body.category !== 'string') {
    errors.push('Complaint category is required.');
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters.');
  }

  if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 5) {
    errors.push('Description must be at least 5 characters.');
  }

  if (!body.room || typeof body.room !== 'string') {
    errors.push('Room number is required.');
  }

  if (!body.block || typeof body.block !== 'string') {
    errors.push('Hostel block is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  ALLOWED_CATEGORIES,
  validateCreateComplaint,
};
