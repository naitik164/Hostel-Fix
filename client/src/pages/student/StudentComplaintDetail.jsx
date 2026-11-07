import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  Wrench,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  Loader2,
  AlertCircle,
  Maximize2,
  X,
  Camera,
} from 'lucide-react';

const StudentComplaintDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Photo lightbox modal
  const [activePhoto, setActivePhoto] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/student/complaints/${id}`);
      if (res.data && res.data.success) {
        setComplaint(res.data.complaint);
        setHistory(res.data.history || []);
        setFeedback(res.data.feedback || null);
        if (res.data.feedback) {
          setRating(res.data.feedback.rating);
          setFeedbackComment(res.data.feedback.comment || '');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setFeedbackSubmitting(true);
      const res = await api.post(`/student/complaints/${id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      if (res.data && res.data.success) {
        setFeedback(res.data.feedback);
        setFeedbackSuccess('Thank you! Your feedback has been recorded.');
        fetchDetail();
      }
    } catch (err) {
      alert('Error submitting feedback: ' + (err.response?.data?.message || err.message));
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-electric" />
        <p className="text-xs font-semibold text-slate-500">Loading complaint details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="glass-card p-10 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-navy">Unable to load complaint</h2>
        <p className="text-xs text-slate-500">{error || 'Complaint record not found.'}</p>
        <Link to="/student/complaints" className="btn-action inline-flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Navigation Breadcrumb */}
      <Link
        to="/student/complaints"
        className="inline-flex items-center gap-2 text-xs font-semibold text-royal hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Complaints</span>
      </Link>

      {/* Main Details Card */}
      <div className="glass-card p-4 sm:p-6 md:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ice/80 pb-5 sm:pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm sm:text-base md:text-lg font-extrabold text-royal bg-ice/80 px-2.5 sm:px-3 py-1 rounded-lg border border-sky/40">
                {complaint.referenceId}
              </span>
              <StatusBadge status={complaint.status} size="lg" />
              <PriorityBadge priority={complaint.priority} size="lg" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-navy font-heading break-words">
              {complaint.title}
            </h1>
          </div>

          <div className="text-xs text-slate-500 sm:text-right shrink-0">
            <div className="flex items-center gap-1 sm:justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="break-words">Logged on {new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
            {complaint.resolvedAt && (
              <div className="text-emerald-600 font-semibold mt-1">
                Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/50 border border-sky/30 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Location & Hostel Block
            </span>
            <div className="font-bold text-navy flex items-center gap-1.5">
              <Building className="w-4 h-4 text-royal" />
              <span>{complaint.hostelBlockName}</span>
            </div>
            <div className="text-slate-500 mt-0.5">
              Room: {complaint.roomNumber || 'Not specified'} {complaint.location ? `(${complaint.location})` : ''}
            </div>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Category & Subcategory
            </span>
            <div className="font-bold text-navy">{complaint.category}</div>
            <div className="text-slate-500 mt-0.5">{complaint.subcategory || 'General'}</div>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Assigned Maintenance Staff
            </span>
            {complaint.assignedStaffId ? (
              <div>
                <div className="font-bold text-navy flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-electric" />
                  <span>{complaint.assignedStaffId.name}</span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  {complaint.assignedStaffId.specialization}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic">Pending warden assignment</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Detailed Issue Description
          </h3>
          <div className="p-4 rounded-xl bg-white/70 border border-sky/30 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
            {complaint.description}
          </div>
        </div>

        {/* Resident Initial Photos Gallery */}
        {complaint.images && complaint.images.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-royal" />
              <span>Your Attached Complaint Photos ({complaint.images.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhoto(imgUrl)}
                  className="relative group rounded-xl overflow-hidden border border-sky/40 cursor-pointer aspect-video bg-slate-100 shadow-sm"
                >
                  <img src={imgUrl} alt={`Complaint Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff Work Evidence (Completed or in Progress) */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-electric" />
              <span>Technician Work & Resolution Proof ({complaint.evidence.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.evidence.map((ev, idx) => {
                const isBefore = ['before', 'staff_before'].includes(ev.evidenceType);
                const isAfter = ['after', 'staff_after'].includes(ev.evidenceType);
                const badge = isBefore ? 'Before Work' : isAfter ? 'Work Completed' : 'Additional Proof';
                const color = isBefore ? 'bg-amber-600' : isAfter ? 'bg-emerald-600' : 'bg-royal';

                return (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto(ev.imageUrl)}
                    className="relative group rounded-xl overflow-hidden border border-sky/40 cursor-pointer aspect-video bg-slate-100 shadow-sm"
                  >
                    <img src={ev.imageUrl} alt={`Technician Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                      <Maximize2 className="w-5 h-5 mb-1" />
                      {ev.caption && <span className="text-[10px] line-clamp-1 italic font-medium">"{ev.caption}"</span>}
                    </div>
                    <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${color} text-[9px] text-white font-bold uppercase shadow-sm`}>
                      {badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejection notice if status is Rejected */}
        {complaint.status === 'Rejected' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Complaint Rejection Notice</span>
            </div>
            <p>{complaint.rejectedReason || 'This complaint was evaluated and rejected by the warden.'}</p>
          </div>
        )}

        {/* Resolution Notes if Resolved */}
        {complaint.status === 'Resolved' && complaint.resolutionNotes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Warden Resolution Summary</span>
            </div>
            <p>{complaint.resolutionNotes}</p>
          </div>
        )}
      </div>

      {/* Post-Resolution Feedback Section */}
      {complaint.status === 'Resolved' && (
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-navy">Service Resolution Feedback</h2>
              <p className="text-xs text-slate-500">
                Rate the quality and speed of maintenance work conducted.
              </p>
            </div>
          </div>

          {feedbackSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
              {feedbackSuccess}
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-navy">{rating} out of 5 stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Review Comments (Optional)</label>
              <textarea
                rows={2}
                placeholder="Share your experience with the technician's repair work..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="glass-input w-full p-3 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="btn-action px-5 py-2 rounded-control text-xs font-bold shadow-md"
            >
              {feedbackSubmitting ? 'Saving Feedback...' : feedback ? 'Update Feedback' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* Status History Timeline */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-heading font-bold text-navy flex items-center gap-2">
          <Clock className="w-5 h-5 text-royal" />
          <span>Status Lifecycle Timeline</span>
        </h2>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky/40">
          {history.map((item, idx) => (
            <div key={item._id || idx} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-electric border-2 border-white shadow-sm" />
              <div className="glass-card p-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-navy">
                    {item.actionType === 'Created'
                      ? 'Complaint Logged'
                      : item.actionType === 'StaffAssigned'
                      ? 'Staff Assigned'
                      : item.actionType === 'StatusChange'
                      ? `Status Updated to ${item.newValue}`
                      : item.actionType === 'PriorityChange'
                      ? `Priority Adjusted to ${item.newValue}`
                      : item.actionType}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                {item.publicNote && (
                  <p className="text-slate-600 mt-1 leading-relaxed bg-white/60 p-2 rounded-lg border border-sky/20">
                    "{item.publicNote}"
                  </p>
                )}
                <div className="text-[10px] text-slate-400 mt-1">
                  Updated by: <span className="font-semibold text-slate-600">{item.performedByName}</span> ({item.performedByRole})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActivePhoto(null)}
              aria-label="Close photo view"
              className="absolute -top-12 right-0 sm:right-0 text-white hover:text-ice p-2.5 touch-target flex items-center justify-center bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activePhoto}
              alt="Full view"
              className="w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentComplaintDetail;
