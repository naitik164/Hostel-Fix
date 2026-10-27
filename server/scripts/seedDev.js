const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('../src/models/Admin');
const User = require('../src/models/User');
const HostelBlock = require('../src/models/HostelBlock');
const Staff = require('../src/models/Staff');
const { Complaint } = require('../src/models/Complaint');
const ComplaintHistory = require('../src/models/ComplaintHistory');
const Notification = require('../src/models/Notification');
const Feedback = require('../src/models/Feedback');
const Counter = require('../src/models/Counter');
const Setting = require('../src/models/Setting');
const connectDB = require('../src/config/db');

const seedDev = async () => {
  try {
    await connectDB();
    console.log('[Seed Dev] Starting complete database seeding with realistic demo records...');

    // 1. Clear collections (safe development reset)
    await Promise.all([
      Admin.deleteMany({}),
      User.deleteMany({}),
      HostelBlock.deleteMany({}),
      Staff.deleteMany({}),
      Complaint.deleteMany({}),
      ComplaintHistory.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      Counter.deleteMany({}),
      Setting.deleteMany({}),
    ]);

    // 2. Seed Default Settings
    await Setting.create({
      key: 'sla_hours',
      value: { Critical: 6, High: 24, Medium: 48, Low: 72 },
      description: 'Resolution target hours by complaint priority',
    });

    // 3. Seed Admin
    const loginId = (process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu').toLowerCase().trim();
    const rawPassword = process.env.ADMIN_PASSWORD || 'Warden@Secure2026';
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const admin = await Admin.create({
      loginId,
      passwordHash,
      name: 'Dr. S. K. Roy (Chief Warden)',
      role: 'admin',
      isActive: true,
      lastLoginAt: new Date(),
    });
    console.log(`[Seed Dev] Created Warden Admin: ${loginId}`);

    // 4. Seed Hostel Blocks
    const blocksData = [
      { name: 'Aryabhata Block', code: 'Block A', description: 'Undergraduate Boys Hostel (Floors 1-4)', totalRooms: 80 },
      { name: 'Kalam Bhavan', code: 'Block B', description: 'Engineering Senior Boys Hostel', totalRooms: 75 },
      { name: 'Ramanujan Hall', code: 'Block C', description: 'Postgraduate & Research Scholars Hostel', totalRooms: 60 },
      { name: 'Visvesvaraya Block', code: 'Block D', description: 'First Year Freshers Hostel', totalRooms: 90 },
      { name: 'Sarojini Naidu Hall', code: 'Block E', description: 'Girls Residential Hall', totalRooms: 85 },
    ];
    const blocks = await HostelBlock.insertMany(blocksData);
    console.log(`[Seed Dev] Created ${blocks.length} Hostel Blocks.`);

    // 5. Seed Maintenance Staff
    const staffData = [
      { name: 'Rajesh Kumar', employeeId: 'EMP-E101', phone: '+91 98765 11001', specialization: 'Electrical' },
      { name: 'Ramesh Yadav', employeeId: 'EMP-P202', phone: '+91 98765 11002', specialization: 'Plumbing' },
      { name: 'Suresh Sharma', employeeId: 'EMP-C303', phone: '+91 98765 11003', specialization: 'Carpentry' },
      { name: 'Sunil Verma', employeeId: 'EMP-H404', phone: '+91 98765 11004', specialization: 'Cleaning & Hygiene' },
      { name: 'Amit Sengupta', employeeId: 'EMP-M505', phone: '+91 98765 11005', specialization: 'Mess & Food' },
      { name: 'Vikas Nair', employeeId: 'EMP-I606', phone: '+91 98765 11006', specialization: 'Internet & IT' },
      { name: 'Mahendra Pratap', employeeId: 'EMP-S707', phone: '+91 98765 11007', specialization: 'Security' },
      { name: 'Satish Patel', employeeId: 'EMP-G808', phone: '+91 98765 11008', specialization: 'General Maintenance' },
    ];
    const staffMembers = await Staff.insertMany(staffData);
    console.log(`[Seed Dev] Created ${staffMembers.length} Staff Members.`);

    // 6. Seed Students (Fictional demo data)
    const studentsData = [
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@hostelfix.edu',
        googleSub: 'google_sub_demo_aarav_101',
        profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        role: 'student',
        hostelBlock: 'Block A',
        roomNumber: 'A-304',
        phone: '+91 98111 22334',
        isActive: true,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@hostelfix.edu',
        googleSub: 'google_sub_demo_priya_102',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'student',
        hostelBlock: 'Block E',
        roomNumber: 'E-201',
        phone: '+91 98222 33445',
        isActive: true,
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@hostelfix.edu',
        googleSub: 'google_sub_demo_rohan_103',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'student',
        hostelBlock: 'Block B',
        roomNumber: 'B-112',
        phone: '+91 98333 44556',
        isActive: true,
      },
      {
        name: 'Ananya Sen',
        email: 'ananya.sen@hostelfix.edu',
        googleSub: 'google_sub_demo_ananya_104',
        profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        role: 'student',
        hostelBlock: 'Block C',
        roomNumber: 'C-405',
        phone: '+91 98444 55667',
        isActive: true,
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@hostelfix.edu',
        googleSub: 'google_sub_demo_vikram_105',
        profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'student',
        hostelBlock: 'Block D',
        roomNumber: 'D-218',
        phone: '+91 98555 66778',
        isActive: true,
      },
    ];
    const students = await User.insertMany(studentsData);
    console.log(`[Seed Dev] Created ${students.length} Student Accounts.`);

    // 7. Seed Complaints with Realistic Chronology
    const staffBySpecialization = {};
    staffMembers.forEach((s) => {
      staffBySpecialization[s.specialization] = s;
    });

    const now = new Date();
    const daysAgo = (days, hours = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      d.setHours(d.getHours() - hours);
      return d;
    };

    const complaintsDefinitions = [
      {
        ref: 'HF-2026-0001',
        student: students[0],
        title: 'Dangerous sparking in main corridor electrical distribution board',
        category: 'Electricity & Lighting',
        subcategory: 'Switchboard / Wiring',
        description: 'Frequent sparks and a burning plastic odor coming from the 3rd-floor distribution board next to Room A-304. Exposed wires visible.',
        priority: 'Critical',
        suggestedPriority: 'Critical',
        priorityReason: 'Flagged as Critical due to detected safety trigger keyword: "sparking"',
        status: 'In Progress',
        block: blocks[0],
        roomNumber: 'A-304 Corridor',
        location: '3rd Floor Main Passage',
        staff: staffBySpecialization['Electrical'],
        created: daysAgo(1, 4),
        assignedAt: daysAgo(1, 2),
      },
      {
        ref: 'HF-2026-0002',
        student: students[1],
        title: 'RO Water cooler dispensing cloudy and metallic tasting water',
        category: 'Drinking Water',
        subcategory: 'Purifier / Filter',
        description: 'The 2nd-floor water cooler filter has not been serviced. Water appears yellowish and smells strongly of iron sediment.',
        priority: 'High',
        suggestedPriority: 'High',
        priorityReason: 'Flagged as High priority due to health/essential utility trigger',
        status: 'Assigned',
        block: blocks[4],
        roomNumber: 'Floor 2 Water Station',
        location: 'East Wing Lobby',
        staff: staffBySpecialization['Plumbing'],
        created: daysAgo(2, 6),
        assignedAt: daysAgo(2, 3),
      },
      {
        ref: 'HF-2026-0003',
        student: students[0],
        title: 'Heavy leak from ceiling pipe causing washroom waterlogging',
        category: 'Plumbing & Washroom',
        subcategory: 'Ceiling Leakage',
        description: 'Upper floor drainage pipe has a hairline crack leaking dirty water steadily onto the 3rd floor washroom floor.',
        priority: 'High',
        suggestedPriority: 'High',
        priorityReason: 'Major plumbing leakage causing hygiene concerns',
        status: 'Resolved',
        block: blocks[0],
        roomNumber: 'A-308 Washroom',
        location: 'North Washroom Complex',
        staff: staffBySpecialization['Plumbing'],
        created: daysAgo(6, 12),
        assignedAt: daysAgo(6, 10),
        resolvedAt: daysAgo(5, 8),
        resolutionNotes: 'PVC joint replaced, sealed with waterproof epoxy and checked for leak-free flow.',
        rating: 5,
        feedbackComment: 'Promptly repaired by Ramesh Yadav. No more leakage!',
      },
      {
        ref: 'HF-2026-0004',
        student: students[2],
        title: 'Under-cooked food and insect found in evening mess curry',
        category: 'Food Quality & Mess',
        subcategory: 'Hygiene & Cleanliness',
        description: 'Dinner served on Sunday contained raw lentils and a dead fly was discovered in the serving tray. Several students reported stomach ache.',
        priority: 'High',
        suggestedPriority: 'High',
        priorityReason: 'Flagged as High priority due to health/essential utility trigger: "insect in food"',
        status: 'Resolved',
        block: blocks[1],
        roomNumber: 'Central Mess Hall',
        location: 'Dining Counter 3',
        staff: staffBySpecialization['Mess & Food'],
        created: daysAgo(8, 20),
        assignedAt: daysAgo(8, 18),
        resolvedAt: daysAgo(7, 10),
        resolutionNotes: 'Mess manager reprimanded. Food safety audit conducted with kitchen staff and food warmers sanitized.',
        rating: 4,
        feedbackComment: 'Hygiene improved immediately in subsequent meals.',
      },
      {
        ref: 'HF-2026-0005',
        student: students[3],
        title: 'Wi-Fi Access Point offline in C-Wing 4th Floor',
        category: 'Internet & Wi-Fi',
        subcategory: 'Router / Access Point',
        description: 'The Cisco router on ceiling pillar 4B has had a blinking red light since yesterday morning. No SSID broadcasting.',
        priority: 'Low',
        suggestedPriority: 'Low',
        priorityReason: 'Standard priority assigned based on category "Internet & Wi-Fi"',
        status: 'Submitted',
        block: blocks[2],
        roomNumber: 'C-405',
        location: '4th Floor Common Hallway',
        created: daysAgo(0, 5),
      },
      {
        ref: 'HF-2026-0006',
        student: students[4],
        title: 'Study table leg cracked and unaligned',
        category: 'Furniture & Fixtures',
        subcategory: 'Study Table',
        description: 'Right wooden leg has fractured near the joint. Table tilts and cannot support monitor or books safely.',
        priority: 'Low',
        suggestedPriority: 'Low',
        priorityReason: 'Standard priority assigned based on category "Furniture & Fixtures"',
        status: 'In Progress',
        block: blocks[3],
        roomNumber: 'D-218',
        location: 'Student Study Desk',
        staff: staffBySpecialization['Carpentry'],
        created: daysAgo(3, 10),
        assignedAt: daysAgo(3, 8),
      },
      {
        ref: 'HF-2026-0007',
        student: students[1],
        title: 'Termite infestation around wooden wardrobe base',
        category: 'Pest Control',
        subcategory: 'Termites',
        description: 'Wood dust accumulating daily behind Room E-201 wardrobe. Multiple holes visible in the wooden skirting.',
        priority: 'Medium',
        suggestedPriority: 'Medium',
        priorityReason: 'Standard priority assigned based on category "Pest Control"',
        status: 'Resolved',
        block: blocks[4],
        roomNumber: 'E-201',
        location: 'Corner Closet',
        staff: staffBySpecialization['General Maintenance'],
        created: daysAgo(10, 14),
        assignedAt: daysAgo(10, 10),
        resolvedAt: daysAgo(8, 16),
        resolutionNotes: 'Professional anti-termite chemical drilling and spray completed. Base panel replaced.',
        rating: 5,
        feedbackComment: 'Very thorough treatment, no new dust observed.',
      },
      {
        ref: 'HF-2026-0008',
        student: students[2],
        title: 'Uncollected garbage bags piling up outside Block B fire exit',
        category: 'Cleanliness & Hygiene',
        subcategory: 'Waste Management',
        description: 'Waste bins have not been emptied for 3 days. Severe odor and stray animals tearing open bags.',
        priority: 'Medium',
        suggestedPriority: 'Low',
        priorityReason: 'Sanitation hazard in emergency exit route',
        status: 'Resolved',
        block: blocks[1],
        roomNumber: 'Staircase B-2',
        location: 'Ground Floor Fire Exit',
        staff: staffBySpecialization['Cleaning & Hygiene'],
        created: daysAgo(5, 8),
        assignedAt: daysAgo(5, 6),
        resolvedAt: daysAgo(4, 18),
        resolutionNotes: 'Sanitation squad cleared 12 bags, disinfected the fire exit area with bleaching powder.',
        rating: 4,
        feedbackComment: 'Cleaned up well.',
      },
      {
        ref: 'HF-2026-0009',
        student: students[4],
        title: 'Main entrance biometric turnstile gate reader malfunctioning',
        category: 'Security & Safety',
        subcategory: 'Access Control',
        description: 'Turnstile gate 2 keeps rejecting valid hostel smartcards causing long queues during 9 PM check-in.',
        priority: 'High',
        suggestedPriority: 'High',
        priorityReason: 'Standard priority assigned based on category "Security & Safety"',
        status: 'In Progress',
        block: blocks[3],
        roomNumber: 'Security Booth',
        location: 'Main Gate Entrance',
        staff: staffBySpecialization['Security'],
        created: daysAgo(1, 14),
        assignedAt: daysAgo(1, 10),
      },
      {
        ref: 'HF-2026-0010',
        student: students[3],
        title: 'Broken tube light in corridor outside room C-405',
        category: 'Electricity & Lighting',
        subcategory: 'Corridor Lighting',
        description: 'Tube light flickers intensely with loud buzzing noise, making reading at night difficult.',
        priority: 'Low',
        suggestedPriority: 'Low',
        priorityReason: 'Standard category default priority',
        status: 'Rejected',
        block: blocks[2],
        roomNumber: 'C-405',
        location: 'Hallway',
        created: daysAgo(4, 16),
        rejectedReason: 'Duplicate of ticket HF-2026-0008 already logged by the floor prefect. Bulb has been queued for replacement.',
      },
    ];

    let counterSeq = 10;
    for (const data of complaintsDefinitions) {
      const complaint = await Complaint.create({
        referenceId: data.ref,
        studentId: data.student._id,
        title: data.title,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        images: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
        ],
        hostelBlockId: data.block._id,
        hostelBlockName: data.block.name,
        roomNumber: data.roomNumber,
        location: data.location,
        priority: data.priority,
        suggestedPriority: data.suggestedPriority,
        priorityReason: data.priorityReason,
        status: data.status,
        assignedStaffId: data.staff ? data.staff._id : null,
        assignedAt: data.assignedAt || null,
        resolvedAt: data.resolvedAt || null,
        resolutionNotes: data.resolutionNotes || '',
        rejectedReason: data.rejectedReason || '',
        createdAt: data.created,
        updatedAt: data.resolvedAt || data.assignedAt || data.created,
      });

      // Audit history
      await ComplaintHistory.create({
        complaintId: complaint._id,
        actionType: 'Created',
        newValue: 'Submitted',
        publicNote: 'Complaint registered by student.',
        performedBy: data.student._id,
        performedByModel: 'User',
        performedByName: data.student.name,
        performedByRole: 'student',
        createdAt: data.created,
      });

      if (data.staff && data.assignedAt) {
        await ComplaintHistory.create({
          complaintId: complaint._id,
          actionType: 'StaffAssigned',
          newValue: data.staff.name,
          publicNote: `Warden assigned ${data.staff.name} (${data.staff.specialization}).`,
          internalNote: 'High priority queue assigned.',
          performedBy: admin._id,
          performedByModel: 'Admin',
          performedByName: admin.name,
          performedByRole: 'admin',
          createdAt: data.assignedAt,
        });
      }

      if (data.status === 'In Progress') {
        await ComplaintHistory.create({
          complaintId: complaint._id,
          actionType: 'StatusChange',
          oldValue: 'Assigned',
          newValue: 'In Progress',
          publicNote: 'Technician on-site inspecting required parts.',
          internalNote: 'Procurement requested for replacement spare parts.',
          performedBy: admin._id,
          performedByModel: 'Admin',
          performedByName: admin.name,
          performedByRole: 'admin',
          createdAt: new Date(data.assignedAt ? data.assignedAt.getTime() + 1000 * 60 * 60 : Date.now()),
        });
      }

      if (data.status === 'Resolved' && data.resolvedAt) {
        await ComplaintHistory.create({
          complaintId: complaint._id,
          actionType: 'StatusChange',
          oldValue: 'In Progress',
          newValue: 'Resolved',
          publicNote: data.resolutionNotes,
          internalNote: 'Inspected by Assistant Warden and verified complete.',
          performedBy: admin._id,
          performedByModel: 'Admin',
          performedByName: admin.name,
          performedByRole: 'admin',
          createdAt: data.resolvedAt,
        });

        // Add feedback
        if (data.rating) {
          await Feedback.create({
            complaintId: complaint._id,
            studentId: data.student._id,
            rating: data.rating,
            comment: data.feedbackComment || '',
            createdAt: new Date(data.resolvedAt.getTime() + 1000 * 60 * 30),
          });
        }
      }

      if (data.status === 'Rejected') {
        await ComplaintHistory.create({
          complaintId: complaint._id,
          actionType: 'Rejected',
          oldValue: 'Submitted',
          newValue: 'Rejected',
          publicNote: data.rejectedReason,
          internalNote: 'Marked duplicate after morning physical round.',
          performedBy: admin._id,
          performedByModel: 'Admin',
          performedByName: admin.name,
          performedByRole: 'admin',
          createdAt: daysAgo(4, 15),
        });
      }
    }

    // Set counter sequence
    const currentYear = new Date().getFullYear();
    await Counter.create({
      _id: `complaints_${currentYear}`,
      seq: counterSeq,
    });

    // 8. Demo Notifications
    await Notification.create([
      {
        recipientId: students[0]._id,
        recipientRole: 'student',
        title: 'Technician Assigned',
        message: 'Rajesh Kumar (Electrical) has been assigned to inspect reference HF-2026-0001.',
        type: 'info',
        link: '/student/complaints',
        isRead: false,
      },
      {
        recipientId: students[0]._id,
        recipientRole: 'student',
        title: 'Complaint Resolved',
        message: 'Your complaint HF-2026-0003 has been marked as Resolved. Please provide your feedback rating.',
        type: 'success',
        link: '/student/complaints',
        isRead: true,
      },
      {
        recipientId: admin._id,
        recipientRole: 'admin',
        title: 'CRITICAL ALERT: HF-2026-0001',
        message: 'New Critical priority complaint in Aryabhata Block: "Dangerous sparking in main corridor electrical distribution board"',
        type: 'critical',
        link: '/admin/complaints',
        isRead: false,
      },
      {
        recipientId: admin._id,
        recipientRole: 'admin',
        title: 'New Complaint Received',
        message: 'A new Wi-Fi complaint was submitted in Ramanujan Hall.',
        type: 'info',
        link: '/admin/complaints',
        isRead: false,
      },
    ]);

    console.log('[Seed Dev] Seed completed successfully!');
    console.log('========================================================');
    console.log('DEMO CREDENTIALS:');
    console.log(`Warden Login : ${loginId} / ${rawPassword}`);
    console.log(`Demo Student : aarav.sharma@hostelfix.edu (use 1-click Demo Login or Google)`);
    console.log('========================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Dev Error]:', error);
    process.exit(1);
  }
};

seedDev();
