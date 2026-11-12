const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Dispatch a notification to a specific recipient
   */
  async notify({ recipientId, role, title, message, complaintId = null, type = 'info' }) {
    try {
      return await Notification.create({
        recipient: recipientId,
        recipientRole: role,
        title,
        message,
        complaint: complaintId,
        type,
        isRead: false,
      });
    } catch (err) {
      console.error('[NotificationService Error]:', err.message);
      return null;
    }
  }

  /**
   * Notify student of status update on their complaint
   */
  async notifyStudentStatusUpdate(studentId, complaintReference, newStatus, complaintId) {
    return await this.notify({
      recipientId: studentId,
      role: 'student',
      title: `Complaint ${complaintReference} Updated`,
      message: `Your complaint ${complaintReference} status has been updated to "${newStatus}".`,
      complaintId,
      type: 'status_update',
    });
  }
}

module.exports = new NotificationService();

