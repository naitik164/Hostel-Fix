const COMPLAINT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

const COMPLAINT_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const CATEGORIES = [
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

module.exports = {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  CATEGORIES,
};
