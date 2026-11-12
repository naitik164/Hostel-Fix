const slaJob = require('./slaJob');
const cleanupJob = require('./cleanupJob');

module.exports = {
  ...slaJob,
  ...cleanupJob,
};
