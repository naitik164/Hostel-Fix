const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const HostelBlock = require('../src/models/HostelBlock');
const Setting = require('../src/models/Setting');
const connectDB = require('../src/config/db');

const seedConfig = async () => {
  try {
    await connectDB();
    console.log('[Seed Config] Configuring official hostel blocks and system settings...');

    // 1. SLA Settings
    const existingSla = await Setting.findOne({ key: 'sla_hours' });
    if (!existingSla) {
      await Setting.create({
        key: 'sla_hours',
        value: { Critical: 6, High: 24, Medium: 48, Low: 72 },
        description: 'SLA target resolution hours by complaint priority',
      });
      console.log('✓ SLA target settings initialized.');
    } else {
      console.log('• SLA settings already exist.');
    }

    // 2. Official Campus Hostel Blocks
    const officialBlocks = [
      { name: 'Aryabhata Block', code: 'BLOCK-A', description: 'Undergraduate Engineering Hostel A', totalRooms: 120 },
      { name: 'Kalam Bhavan', code: 'BLOCK-B', description: 'Undergraduate Engineering Hostel B', totalRooms: 120 },
      { name: 'Ramanujan Hall', code: 'BLOCK-C', description: 'Postgraduate & Research Scholar Block', totalRooms: 90 },
      { name: 'Visvesvaraya Block', code: 'BLOCK-D', description: 'Senior Undergraduate Block', totalRooms: 100 },
      { name: 'Sarojini Naidu Hall', code: 'BLOCK-E', description: 'Girls Hostel Complex', totalRooms: 150 },
    ];

    for (const block of officialBlocks) {
      const exists = await HostelBlock.findOne({ code: block.code });
      if (!exists) {
        await HostelBlock.create(block);
        console.log(`✓ Created hostel block: ${block.name} (${block.code})`);
      } else {
        console.log(`• Block ${block.code} already exists.`);
      }
    }

    console.log('[Seed Config] Infrastructure configuration complete.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Config Error]:', err);
    process.exit(1);
  }
};

seedConfig();
