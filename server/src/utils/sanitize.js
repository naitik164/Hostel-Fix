/**
 * Protect against CSV / Spreadsheet Formula Injection (CWE-1236).
 * Prepend a single quote if the field begins with unsafe formula trigger characters.
 */
const sanitizeForCsv = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  let str = String(value);

  // If text starts with =, +, -, @, \t, or \r, prepend an apostrophe
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes for CSV compliance
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

module.exports = {
  sanitizeForCsv,
};
