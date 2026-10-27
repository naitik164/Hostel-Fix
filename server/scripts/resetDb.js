const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../src/config/db');

const resetDb = async () => {
  try {
    const conn = await connectDB();
    console.log('[Reset DB] Dropping database...');
    await conn.connection.dropDatabase();
    console.log('[Reset DB] Database dropped cleanly.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Reset DB Error]:', error);
    process.exit(1);
  }
};

resetDb();
