const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../src/config/db');

const resetDb = async () => {
  if (process.env.CONFIRM_DROP_DATABASE !== 'I_UNDERSTAND_THIS_DELETES_ALL_DATA') {
    console.error('[SAFETY BLOCK]: resetDb aborted. Database drop requires CONFIRM_DROP_DATABASE="I_UNDERSTAND_THIS_DELETES_ALL_DATA"');
    process.exit(1);
  }

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
