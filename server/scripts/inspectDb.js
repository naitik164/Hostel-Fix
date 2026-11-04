const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = require('../src/config/db');

const inspect = async () => {
  try {
    const conn = await connectDB();
    console.log(`\n================ DATABASE INSPECTION REPORT ================`);
    console.log(`Connected to: ${conn.connection.host}/${conn.connection.name}`);

    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\nCollections count: ${collections.length}`);

    const counts = {};
    for (const col of collections) {
      const collectionName = col.name;
      const count = await conn.connection.db.collection(collectionName).countDocuments();
      counts[collectionName] = count;
      console.log(`- Collection [${collectionName}]: ${count} documents`);
    }

    // Inspect Users
    if (counts['users'] > 0) {
      console.log('\n--- USERS IN DATABASE ---');
      const users = await conn.connection.db.collection('users').find({}).toArray();
      users.forEach(u => console.log(`  User: ${u.email} | Name: ${u.name} | Role: ${u.role} | googleSub: ${u.googleSub}`));
    }

    // Inspect Admins
    if (counts['admins'] > 0) {
      console.log('\n--- ADMINS IN DATABASE ---');
      const admins = await conn.connection.db.collection('admins').find({}).toArray();
      admins.forEach(a => console.log(`  Admin: ${a.loginId} | Name: ${a.name} | Role: ${a.role}`));
    }

    // Inspect Complaints
    if (counts['complaints'] > 0) {
      console.log('\n--- COMPLAINTS IN DATABASE ---');
      const complaints = await conn.connection.db.collection('complaints').find({}).toArray();
      complaints.forEach(c => console.log(`  Complaint: [${c.referenceId}] ${c.title} | Status: ${c.status} | Category: ${c.category}`));
    }

    // Inspect HostelBlocks
    if (counts['hostelblocks'] > 0) {
      console.log('\n--- HOSTEL BLOCKS IN DATABASE ---');
      const blocks = await conn.connection.db.collection('hostelblocks').find({}).toArray();
      blocks.forEach(b => console.log(`  Block: ${b.name} | Code: ${b.code} | Floors: ${b.totalFloors}`));
    }

    // Inspect Staff
    if (counts['staffs'] > 0) {
      console.log('\n--- STAFF IN DATABASE ---');
      const staffs = await conn.connection.db.collection('staffs').find({}).toArray();
      staffs.forEach(s => console.log(`  Staff: ${s.name} | Department: ${s.department} | Status: ${s.status}`));
    }

    // Inspect Settings
    if (counts['settings'] > 0) {
      console.log('\n--- SETTINGS IN DATABASE ---');
      const settings = await conn.connection.db.collection('settings').find({}).toArray();
      settings.forEach(s => console.log(`  Setting: ${s.key} => ${JSON.stringify(s.value)}`));
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Inspection error:', err);
    process.exit(1);
  }
};

inspect();
