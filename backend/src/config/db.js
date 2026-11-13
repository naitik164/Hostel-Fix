// Centralized export for MongoDB database configuration and lifecycle telemetry
const database = require('./database');

module.exports = database;
module.exports.connectDB = database.connectDB || database;
module.exports.getDatabaseStatus = database.getDatabaseStatus;
module.exports.isDatabaseReady = database.isDatabaseReady;
module.exports.scheduleReconnect = database.scheduleReconnect;
