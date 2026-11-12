const Complaint = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const { generateReferenceNumber } = require('../utils/referenceGenerator');
const { calculatePriority } = require('../utils/priorityRules');

class ComplaintService {
  /**
   * Create a new complaint with reference ID, calculated priority, and initial history record
   */
  async createComplaint({ studentId, category, title, description, room, block, photoUrl, userPriority }) {
    const calculatedPriority = calculatePriority({
      category,
      title,
      description,
      userPriority,
    });

    const referenceNumber = await generateReferenceNumber(block);

    // Default SLA target: 24h for Critical/High, 48h for Medium, 72h for Low
    const slaHours = calculatedPriority === 'Critical' ? 12 : calculatedPriority === 'High' ? 24 : 48;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const complaint = await Complaint.create({
      referenceNumber,
      student: studentId,
      category,
      title,
      description,
      room,
      block,
      photos: photoUrl ? [photoUrl] : [],
      priority: calculatedPriority,
      status: 'pending',
      slaDeadline,
    });

    // Record initial history timeline entry
    await ComplaintHistory.create({
      complaint: complaint._id,
      action: 'created',
      performedBy: studentId,
      performedByRole: 'student',
      status: 'pending',
      notes: `Complaint logged under ${category} with priority ${calculatedPriority}`,
    });

    return complaint;
  }

  /**
   * Transition complaint status with audit logging
   */
  async updateStatus(complaintId, { newStatus, performedBy, role, notes, proofPhoto }) {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const previousStatus = complaint.status;
    complaint.status = newStatus;

    if (proofPhoto) {
      complaint.resolutionProof = proofPhoto;
    }

    if (newStatus === 'resolved') {
      complaint.resolvedAt = new Date();
    } else if (newStatus === 'verified') {
      complaint.verifiedAt = new Date();
    }

    await complaint.save();

    // Log history
    await ComplaintHistory.create({
      complaint: complaint._id,
      action: `status_change_to_${newStatus}`,
      performedBy,
      performedByRole: role,
      status: newStatus,
      notes: notes || `Status updated from ${previousStatus} to ${newStatus}`,
      photo: proofPhoto,
    });

    return complaint;
  }
}

module.exports = new ComplaintService();
