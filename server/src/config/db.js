const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to prevent Windows querySrv ECONNREFUSED on MongoDB Atlas SRV lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Proceed with system resolver if platform restricts override
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Database Error]: MONGODB_URI is not defined in server/.env. Atlas connection required.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'hostelfix',
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[Database] MongoDB Atlas Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Atlas connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

