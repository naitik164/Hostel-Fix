const Complaint = require('../models/Complaint');

/**
 * Audit and check for complaints that have breached SLA
 */
const checkSLABreaches = async () => {
  try {
    const now = new Date();
    const overdueComplaints = await Complaint.find({
      status: { $in: ['pending', 'assigned', 'in_progress'] },
      slaDeadline: { $lt: now },
      isOverdue: { $ne: true },
    });

    if (overdueComplaints.length > 0) {
      console.log(`[SLA Job] Found ${overdueComplaints.length} complaints breaching SLA target.`);
      for (const complaint of overdueComplaints) {
        complaint.isOverdue = true;
        await complaint.save();
      }
    }

    return { processedCount: overdueComplaints.length };
  } catch (err) {
    console.error('[SLA Job Error]:', err.message);
    return { error: err.message };
  }
};

module.exports = {
  checkSLABreaches,
};
