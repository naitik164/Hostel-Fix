const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('../src/models/Admin');
const connectDB = require('../src/config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const loginId = (process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu').toLowerCase().trim();
    const rawPassword = process.env.ADMIN_PASSWORD || 'Warden@Secure2026';
    const name = process.env.ADMIN_NAME || 'Chief Warden Office';

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const existingAdmin = await Admin.findOne({ loginId });

    if (existingAdmin) {
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.name = name;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log(`[Seed Admin] Admin account "${loginId}" updated successfully.`);
    } else {
      await Admin.create({
        loginId,
        passwordHash,
        name,
        role: 'admin',
        isActive: true,
      });
      console.log(`[Seed Admin] Admin account "${loginId}" created successfully.`);
    }

    console.log('--------------------------------------------------');
    console.log(`Warden Login ID : ${loginId}`);
    console.log(`Password        : ${rawPassword}`);
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Admin Error]:', error);
    process.exit(1);
  }
};

seedAdmin();
