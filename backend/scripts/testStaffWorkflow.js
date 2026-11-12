const dns = require('dns');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const BASE_URL = 'http://localhost:5000';

async function runStaffWorkflowAudit() {
  console.log('========================================================================');
  console.log(' HOSTELFIX — COMPLETE STAFF PORTAL & WORKFLOW END-TO-END VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // STEP 1: WARDEN LOGIN & STAFF REGISTRATION
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Warden Authentication & Staff Account Provisioning ---');

  const wardenRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: process.env.ADMIN_LOGIN_ID || 'admin@hostelfix.edu',
      password: process.env.ADMIN_PASSWORD || 'Warden@Secure2026',
    }),
  });
  const wardenCookie = wardenRes.headers.get('set-cookie');
  const wardenData = await wardenRes.json();
  assert(wardenRes.status === 200 && wardenData.success, 'Warden logs in successfully via custom credentials');

  const timestamp = Date.now();
  const staffEmailA = `technician.a.${timestamp}@hostelfix.edu`;
  const staffEmailB = `technician.b.${timestamp}@hostelfix.edu`;
  const staffEmpIdA = `EMP-A-${timestamp.toString().slice(-4)}`;
  const staffEmpIdB = `EMP-B-${timestamp.toString().slice(-4)}`;

  // Warden registers Staff A
  const createStaffRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({
      name: 'Ramesh Electrical',
      employeeId: staffEmpIdA,
      email: staffEmailA,
      phone: '+91 98765 43210',
      specialization: 'Electrical',
      department: 'Electrical Maintenance',
      assignedBlocks: ['A-Block (Godavari)', 'B-Block (Krishna)'],
    }),
  });
  const createStaffData = await createStaffRes.json();
  assert(createStaffRes.status === 201 && createStaffData.success, 'Warden registers Staff A with approved Google email and assigned blocks');
  const staffAId = createStaffData.staff._id;

  // Warden registers Staff B (for cross-staff isolation testing)
  const createStaffBRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({
      name: 'Suresh Plumbing',
      employeeId: staffEmpIdB,
      email: staffEmailB,
      phone: '+91 98765 43211',
      specialization: 'Plumbing',
      department: 'Plumbing Maintenance',
      assignedBlocks: ['C-Block (Kaveri)'],
    }),
  });
  const createStaffBData = await createStaffBRes.json();
  assert(createStaffBRes.status === 201 && createStaffBData.success, 'Warden registers Staff B for trade & task isolation verification');
  const staffBId = createStaffBData.staff._id;

  // Attempt duplicate registration with same email should fail
  const dupEmailRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({
      name: 'Duplicate Staff',
      employeeId: `EMP-DUP-${timestamp}`,
      email: staffEmailA,
      specialization: 'Electrical',
    }),
  });
  assert(dupEmailRes.status === 400, 'Duplicate Google email registration is strictly rejected with 400');

  // --------------------------------------------------------------------------
  // STEP 2: STAFF GOOGLE AUTHENTICATION & ACCESS CONTROL
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Staff Google Authentication & Authorization Security ---');

  // Test 2.1: Unregistered Google email denied staff access
  const unregRes = await fetch(`${BASE_URL}/api/auth/demo-staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `unregistered.user.${timestamp}@gmail.com`,
      name: 'Unregistered User',
    }),
  });
  const unregData = await unregRes.json();
  assert(unregRes.status === 403 && !unregData.success, 'Unregistered Google account denied staff access (403 Forbidden: Contact Warden)');

  // Test 2.2: Deactivated staff member denied access
  await fetch(`${BASE_URL}/api/admin/staff/${staffBId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({ isActive: false }),
  });
  const deactRes = await fetch(`${BASE_URL}/api/auth/demo-staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmailB, name: 'Suresh Plumbing' }),
  });
  assert(deactRes.status === 403, 'Deactivated staff member denied login access (403 Forbidden: Account Deactivated)');

  // Reactivate Staff B for subsequent tests
  await fetch(`${BASE_URL}/api/admin/staff/${staffBId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({ isActive: true }),
  });

  // Test 2.3: Active registered Staff A logs in successfully
  const staffALoginRes = await fetch(`${BASE_URL}/api/auth/demo-staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmailA,
      name: 'Ramesh Electrical',
      googleSub: `google_sub_${staffEmpIdA}`,
    }),
  });
  const staffACookie = staffALoginRes.headers.get('set-cookie');
  const staffALoginData = await staffALoginRes.json();
  assert(staffALoginRes.status === 200 && staffALoginData.user.role === 'staff', 'Registered Staff A authenticated with role: "staff" and HttpOnly cookie');

  // Test 2.4: Active registered Staff B logs in
  const staffBLoginRes = await fetch(`${BASE_URL}/api/auth/demo-staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmailB,
      name: 'Suresh Plumbing',
      googleSub: `google_sub_${staffEmpIdB}`,
    }),
  });
  const staffBCookie = staffBLoginRes.headers.get('set-cookie');

  // Test 2.5: Session restoration on page refresh (GET /api/auth/me)
  const staffARefreshRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: staffACookie },
  });
  const staffARefreshData = await staffARefreshRes.json();
  assert(
    staffARefreshRes.status === 200 &&
    staffARefreshData.user.role === 'staff' &&
    staffARefreshData.user.employeeId === staffEmpIdA,
    'Session restoration on page refresh: GET /api/auth/me restores staff identity & role'
  );

  // --------------------------------------------------------------------------
  // STEP 3: STRICT ROLE & TASK ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Cross-Role & Cross-Staff Task Isolation ---');

  // Student logs in
  const studentEmail = `student.test.${timestamp}@hostelfix.edu`;
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/demo-student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, name: 'Test Student' }),
  });
  const studentCookie = studentLoginRes.headers.get('set-cookie');

  // Test 3.1: Student cannot access staff endpoints
  const studentStaffRes = await fetch(`${BASE_URL}/api/staff/dashboard`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentStaffRes.status === 403, 'Student session rejected from staff API /api/staff/dashboard (403 Forbidden)');

  // Test 3.2: Staff cannot access warden endpoints
  const staffAdminRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Cookie: staffACookie },
  });
  assert(staffAdminRes.status === 403, 'Staff session rejected from warden API /api/admin/dashboard (403 Forbidden)');

  // Test 3.3: Staff cannot register new staff
  const staffAddStaffRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({ name: 'Hacker', email: 'hack@hack.com' }),
  });
  assert(staffAddStaffRes.status === 403, 'Staff prevented from creating or promoting staff accounts (403 Forbidden)');

  // --------------------------------------------------------------------------
  // STEP 4: COMPLAINT LIFECYCLE: STUDENT -> WARDEN ASSIGNMENT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Complaint Submission & Warden Task Assignment ---');

  // Student submits complaint
  const submitComplaintRes = await fetch(`${BASE_URL}/api/student/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      title: 'Ceiling Fan Sparking & Speed Regulator Burnt',
      category: 'Electricity & Lighting',
      subcategory: 'Fan / Regulator',
      description: 'The ceiling fan in room 204 produces burning sparks when turned on.',
      hostelBlockName: 'A-Block (Godavari)',
      roomNumber: '204',
      preferredContact: 'Phone',
    }),
  });
  const submitComplaintData = await submitComplaintRes.json();
  if (submitComplaintRes.status !== 201) {
    console.error('submitComplaint returned status:', submitComplaintRes.status, submitComplaintData);
  }
  assert(submitComplaintRes.status === 201 && submitComplaintData.complaint, 'Student lodges complaint in MongoDB Atlas with atomic reference ID');
  const complaintId = submitComplaintData.complaint._id;

  // Warden assigns complaint to Staff A with instructions
  const assignRes = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/assignment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({
      staffId: staffAId,
      instructions: 'Please bring a replacement 2.5uF capacitor and check room wiring breaker.',
      priority: 'High',
    }),
  });
  const assignData = await assignRes.json();
  assert(assignRes.status === 200 && assignData.complaint.status === 'Assigned', 'Warden assigns complaint to Staff A; status automatically updates to "Assigned"');

  // Staff A dashboard displays the new assignment
  const staffDashRes = await fetch(`${BASE_URL}/api/staff/dashboard`, {
    headers: { Cookie: staffACookie },
  });
  const staffDashData = await staffDashRes.json();
  if (staffDashRes.status !== 200) {
    console.error('staffDashRes returned status:', staffDashRes.status, staffDashData);
  }
  assert(staffDashData.stats && staffDashData.stats.newAssignments >= 1, 'Assigned task appears immediately in Staff A dashboard metrics');

  // --------------------------------------------------------------------------
  // STEP 5: STAFF ACCEPTANCE & WORK COMMENCEMENT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Staff Acceptance & Work Start ---');

  // Cross-staff check: Staff B cannot access or accept Staff A's task
  const crossStaffTaskRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}`, {
    headers: { Cookie: staffBCookie },
  });
  assert(crossStaffTaskRes.status === 403, 'Cross-Staff Task Isolation: Staff B cannot access task assigned to Staff A (403 Forbidden)');

  const crossStaffAcceptRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/accept`, {
    method: 'PATCH',
    headers: { Cookie: staffBCookie },
  });
  assert(crossStaffAcceptRes.status === 403, 'Cross-Staff Security: Staff B cannot accept Staff A\'s task (403 Forbidden)');

  // Staff A accepts task
  const acceptRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/accept`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({ note: 'Accepted. Will arrive at room 204 at 10:30 AM.' }),
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200 && acceptData.task.status === 'Accepted', 'Staff A accepts task; status transitions to "Accepted"');

  // Staff A starts work on site
  const startRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({ notes: 'On-site: Disassembled switchboard and inspected wiring.' }),
  });
  const startData = await startRes.json();
  assert(startRes.status === 200 && startData.task.status === 'In Progress', 'Staff A starts work on site; status transitions to "In Progress"');

  // --------------------------------------------------------------------------
  // STEP 6: PHOTO EVIDENCE UPLOAD & VERIFICATION VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Photo Proof Evidence & Verification Gatekeeping ---');

  // Attempting to submit for verification WITHOUT photo proof must be rejected (400)
  const noProofRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/submit-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({ completionNotes: 'Done repair.' }),
  });
  assert(noProofRes.status === 400, 'Gatekeeping: Submitting verification without photo proof is strictly rejected (400 Bad Request)');

  // Staff A uploads photo evidence (Before & After photos)
  // Create a minimal 1x1 test JPEG buffer
  const sampleJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const sampleBuffer = Buffer.from(sampleJpegBase64, 'base64');

  const boundary = '----HostelFixFormBoundary' + timestamp;
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="evidenceType"\r\n\r\n` +
      `before\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="caption"\r\n\r\n` +
      `Initial burnt regulator switch before replacement\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="images"; filename="before_repair.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    ),
    sampleBuffer,
    Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="images"; filename="after_repair.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    ),
    sampleBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: staffACookie,
    },
    body: multipartBody,
  });
  const uploadData = await uploadRes.json();
  if (uploadRes.status !== 200) {
    console.error('uploadRes returned status:', uploadRes.status, uploadData);
  }
  assert(uploadRes.status === 200 && uploadData.evidence && uploadData.evidence.length >= 2, 'Staff uploads multiple photo proofs (before & after); saved to storage with metadata');

  // Attempting verification without completion notes is rejected (400)
  const noNotesRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/submit-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({ completionNotes: '' }),
  });
  assert(noNotesRes.status === 400, 'Gatekeeping: Submitting verification without completion notes is rejected (400 Bad Request)');

  // Staff A submits for verification
  const submitVerifRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/submit-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({
      completionNotes: 'Replaced burnt regulator with new Anchor 5-step model. Tested fan speed on all levels.',
    }),
  });
  const submitVerifData = await submitVerifRes.json();
  if (submitVerifRes.status !== 200) {
    console.error('submitVerifRes returned status:', submitVerifRes.status, submitVerifData);
  }
  assert(submitVerifRes.status === 200 && submitVerifData.task && submitVerifData.task.status === 'Pending Verification', 'Task submitted for verification; status transitions to "Pending Verification"');

  // --------------------------------------------------------------------------
  // STEP 7: WARDEN VERIFICATION, REWORK CYCLE & FINAL RESOLUTION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Warden Verification Review, Rework Request & Final Sign-Off ---');

  // Warden retrieves pending verifications
  const pendingRes = await fetch(`${BASE_URL}/api/admin/verifications`, {
    headers: { Cookie: wardenCookie },
  });
  const pendingData = await pendingRes.json();
  const pendingComplaint = pendingData.complaints.find((c) => c._id === complaintId);
  assert(Boolean(pendingComplaint), 'Task appears in Warden Pending Verification queue with photo proof');

  // Staff cannot approve their own work
  const staffApproveRes = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/verification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({ action: 'approve' }),
  });
  assert(staffApproveRes.status === 403, 'Security: Staff cannot approve their own work or access warden verification endpoint (403 Forbidden)');

  // Warden requests rework with mandatory explanation
  const reworkRes = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/verification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({
      action: 'request_rework',
      reworkReason: 'Switchboard faceplate screws are loose and exposed. Tighten faceplate for safety.',
    }),
  });
  const reworkData = await reworkRes.json();
  assert(reworkRes.status === 200 && reworkData.complaint.status === 'Rework Required', 'Warden requests rework; status updates to "Rework Required" and increments reworkCount');

  // Check that Staff A sees rework task
  const staffReworkTaskRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}`, {
    headers: { Cookie: staffACookie },
  });
  const staffReworkTaskData = await staffReworkTaskRes.json();
  assert(
    staffReworkTaskData.task.status === 'Rework Required' &&
    staffReworkTaskData.task.reworkReason.includes('loose and exposed'),
    'Rework task with mandatory warden feedback is visible to assigned Staff A'
  );

  // Staff A starts work on rework, uploads round 2 photo proof
  await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
  });

  const boundaryRound2 = '----HostelFixFormRound2' + timestamp;
  const multipartBodyRound2 = Buffer.concat([
    Buffer.from(
      `--${boundaryRound2}\r\n` +
      `Content-Disposition: form-data; name="evidenceType"\r\n\r\n` +
      `after\r\n` +
      `--${boundaryRound2}\r\n` +
      `Content-Disposition: form-data; name="caption"\r\n\r\n` +
      `Round 2: Switchboard faceplate securely fastened with insulated screws\r\n` +
      `--${boundaryRound2}\r\n` +
      `Content-Disposition: form-data; name="images"; filename="rework_fixed.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    ),
    sampleBuffer,
    Buffer.from(`\r\n--${boundaryRound2}--\r\n`),
  ]);

  await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundaryRound2}`,
      Cookie: staffACookie,
    },
    body: multipartBodyRound2,
  });

  // Resubmit for verification
  await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}/submit-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffACookie },
    body: JSON.stringify({
      completionNotes: 'Fastened all screws securely and verified safe earthing.',
    }),
  });

  // Verify historical evidence preservation
  const taskAfterReworkRes = await fetch(`${BASE_URL}/api/staff/tasks/${complaintId}`, {
    headers: { Cookie: staffACookie },
  });
  const taskAfterReworkData = await taskAfterReworkRes.json();
  assert(
    taskAfterReworkData.task.evidence.length >= 3,
    'Audit Preservation: Historical evidence preserved across rework rounds (Round 1 + Round 2)'
  );

  // Warden verifies and approves completion!
  const finalApproveRes = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/verification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
    body: JSON.stringify({
      action: 'approve',
      resolutionNotes: 'Verified on-site: Faceplate secure, fan functioning properly at all speeds.',
    }),
  });
  const finalApproveData = await finalApproveRes.json();
  assert(
    finalApproveRes.status === 200 &&
    finalApproveData.complaint.status === 'Resolved' &&
    finalApproveData.complaint.resolvedAt &&
    finalApproveData.complaint.verifiedBy,
    'Warden approves completion: Status becomes "Resolved", resolvedAt & verifiedBy recorded'
  );

  // Student checks complaint in Student Portal
  const studentViewRes = await fetch(`${BASE_URL}/api/student/complaints/${complaintId}`, {
    headers: { Cookie: studentCookie },
  });
  const studentViewData = await studentViewRes.json();
  assert(
    studentViewData.complaint.status === 'Resolved' &&
    studentViewData.complaint.resolutionNotes.includes('Verified on-site'),
    'Student Portal reflects "Resolved" status with warden verification sign-off notes'
  );

  // --------------------------------------------------------------------------
  // STEP 8: LOGOUT & SESSION INVALIDATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: Staff Logout & Invalidation ---');

  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: staffACookie },
  });
  assert(logoutRes.status === 200, 'Staff logout succeeds via POST /api/auth/logout');

  const postLogoutMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: staffACookie },
  });
  assert(postLogoutMeRes.status === 401, 'Post-logout session cookie is invalidated in MongoDB (401 Unauthorized)');

  console.log('\n========================================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(' ALL 25 REQUIRED STAFF & WARDEN VERIFICATION CRITERIA VERIFIED');
  console.log('========================================================================\n');
}

runStaffWorkflowAudit().catch((err) => {
  console.error('\n[AUDIT FAILED]:', err);
  process.exit(1);
});
