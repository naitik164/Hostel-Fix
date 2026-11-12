// User Roles
export const ROLES = {
  STUDENT: 'student',
  STAFF: 'staff',
  ADMIN: 'admin',
  WARDEN: 'warden',
};

// Complaint Statuses
export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

// Complaint Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// Complaint Categories
export const COMPLAINT_CATEGORIES = [
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

// Hostel Blocks
export const HOSTEL_BLOCKS = [
  'Block A',
  'Block B',
  'Block C',
  'Block D',
  'Block E',
  'PG Block',
];

export default {
  ROLES,
  COMPLAINT_STATUS,
  PRIORITY_LEVELS,
  COMPLAINT_CATEGORIES,
  HOSTEL_BLOCKS,
};

