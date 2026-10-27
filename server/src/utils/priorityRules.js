/**
 * Server-side transparent priority suggestion rules.
 * Suggests priority (Low, Medium, High, Critical) based on category, title, and description.
 * Wardens can always inspect the suggested priority and override with reason.
 */

const CRITICAL_KEYWORDS = [
  'exposed wire',
  'sparking',
  'electric shock',
  'short circuit',
  'fire hazard',
  'gas leak',
  'ceiling collapse',
  'wall crack',
  'smoke',
  'water flood',
  'live wire',
  'burning smell',
  'emergency',
];

const HIGH_KEYWORDS = [
  'no drinking water',
  'water outage',
  'food poisoning',
  'worms in food',
  'insect in food',
  'spoiled food',
  'door lock broken',
  'theft',
  'washroom overflow',
  'sewage leak',
  'complete blackout',
  'heavy leak',
  'toxic',
];

const CATEGORY_DEFAULT_PRIORITIES = {
  'Security & Safety': 'High',
  'Drinking Water': 'Medium',
  'Electricity & Lighting': 'Medium',
  'Food Quality & Mess': 'Medium',
  'Plumbing & Washroom': 'Medium',
  'Pest Control': 'Medium',
  'Room Maintenance': 'Medium',
  'Cleanliness & Hygiene': 'Low',
  'Furniture & Fixtures': 'Low',
  'Internet & Wi-Fi': 'Low',
  'Common Area Maintenance': 'Low',
  'Other': 'Medium',
};

const suggestPriority = (category, title = '', description = '') => {
  const combinedText = `${title} ${description}`.toLowerCase();

  // Check for critical life/safety keywords first
  for (const keyword of CRITICAL_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      return {
        priority: 'Critical',
        reason: `Flagged as Critical due to detected safety trigger keyword: "${keyword}"`,
      };
    }
  }

  // Check for high urgency keywords
  for (const keyword of HIGH_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      return {
        priority: 'High',
        reason: `Flagged as High priority due to health/essential utility trigger: "${keyword}"`,
      };
    }
  }

  // Fall back to category default
  const defaultPriority = CATEGORY_DEFAULT_PRIORITIES[category] || 'Medium';
  return {
    priority: defaultPriority,
    reason: `Standard priority assigned based on category "${category}"`,
  };
};

module.exports = {
  suggestPriority,
  CRITICAL_KEYWORDS,
  HIGH_KEYWORDS,
};
