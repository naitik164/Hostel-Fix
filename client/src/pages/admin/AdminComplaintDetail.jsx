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
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lock,
  Star,
  Maximize2,
  X,
  Loader2,
  ShieldAlert,
  Send,
  UserCheck,
  Camera,
} from 'lucide-react';

const AdminComplaintDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [error, setError] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'priority' | 'assign'
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [priorityReason, setPriorityReason] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Add notes state
  const [quickPublicNote, setQuickPublicNote] = useState('');
  const [quickInternalNote, setQuickInternalNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Lightbox
  const [activePhoto, setActivePhoto] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/admin/complaints/${id}`);
      if (res.data && res.data.success) {
        setComplaint(res.data.complaint);
        setHistory(res.data.history || []);
        setFeedback(res.data.feedback || null);
        setStaffList(res.data.staffList || []);
        setNewStatus(res.data.complaint.status);
        setNewPriority(res.data.complaint.priority);
        setSelectedStaffId(res.data.complaint.assignedStaffId?._id || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await api.patch(`/admin/complaints/${id}/status`, {
        status: newStatus,
        publicNote: statusNote,
        internalNote,
        resolutionNotes: newStatus === 'Resolved' ? statusNote : undefined,
        rejectedReason: newStatus === 'Rejected' ? statusNote : undefined,
      });
      setActiveModal(null);
      fetchDetail();
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await api.patch(`/admin/complaints/${id}/priority`, {
        priority: newPriority,
        priorityReason,
      });
      setActiveModal(null);
      fetchDetail();
    } catch (err) {
      alert('Error updating priority: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    try {
      setModalLoading(true);
      await api.patch(`/admin/complaints/${id}/assignment`, {
        staffId: selectedStaffId,
      });
      setActiveModal(null);
      fetchDetail();
    } catch (err) {
      alert('Error assigning staff: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddNotes = async (e) => {
    e.preventDefault();
    if (!quickPublicNote.trim() && !quickInternalNote.trim()) return;
    try {
      setAddingNote(true);
      await api.post(`/admin/complaints/${id}/notes`, {
        publicNote: quickPublicNote,
        internalNote: quickInternalNote,
      });
      setQuickPublicNote('');
      setQuickInternalNote('');
      fetchDetail();
    } catch (err) {
      alert('Error adding notes: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-electric" />
        <p className="text-xs font-semibold text-slate-500">Loading complaint inspection data...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="glass-card p-10 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-navy">Unable to load complaint</h2>
        <p className="text-xs text-slate-500">{error || 'Complaint record not found.'}</p>
        <Link to="/admin/complaints" className="btn-action inline-flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back Link */}
      <Link
        to="/admin/complaints"
        className="inline-flex items-center gap-2 text-xs font-semibold text-royal hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Complaints Repository</span>
      </Link>

      {/* Top Header Card */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ice/80 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-base sm:text-lg font-extrabold text-royal bg-ice px-3 py-1 rounded-lg border border-sky/40">
                {complaint.referenceId}
              </span>
              <StatusBadge status={complaint.status} size="lg" />
              <PriorityBadge priority={complaint.priority} size="lg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy font-heading">
              {complaint.title}
            </h1>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveModal('status')}
              className="btn-action px-3.5 py-2 rounded-control text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Status</span>
            </button>
            <button
              onClick={() => setActiveModal('priority')}
              className="btn-secondary px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-royal" />
              <span>Override Priority</span>
            </button>
            <button
              onClick={() => setActiveModal('assign')}
              className="btn-secondary px-3.5 py-2 rounded-control text-xs font-bold flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-electric" />
              <span>Assign Staff</span>
            </button>
          </div>
        </div>

        {/* Resident & Assignment Detail Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/50 border border-sky/30 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Resident Student
            </span>
            <div className="font-bold text-navy">{complaint.studentId?.name || 'Student'}</div>
            <div className="text-slate-500 mt-0.5">{complaint.studentId?.email}</div>
            <div className="text-slate-500 font-medium">Phone: {complaint.studentId?.phone || 'N/A'}</div>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Hostel Location
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
              Assigned Maintenance Technician
            </span>
            {complaint.assignedStaffId ? (
              <div>
                <div className="font-bold text-navy flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-electric" />
                  <span>{complaint.assignedStaffId.name}</span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  Specialization: {complaint.assignedStaffId.specialization} ({complaint.assignedStaffId.phone || 'No phone'})
                </div>
              </div>
            ) : (
              <span className="text-rose-500 font-bold">Unassigned — Click 'Assign Staff'</span>
            )}
          </div>
        </div>

        {/* Issue Description */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Resident Complaint Description
          </h3>
          <div className="p-4 rounded-xl bg-white/70 border border-sky/30 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
            {complaint.description}
          </div>
        </div>

        {/* Resident Complaint Photos */}
        {complaint.images && complaint.images.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-royal" />
              <span>Resident Initial Complaint Photos ({complaint.images.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhoto(imgUrl)}
                  className="relative group rounded-xl overflow-hidden border border-sky/40 cursor-pointer aspect-video bg-slate-100 shadow-sm"
                >
                  <img src={imgUrl} alt={`Resident Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono uppercase">
                    Resident
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff Repair & Verification Evidence */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-electric" />
              <span>Staff Maintenance & Verification Evidence ({complaint.evidence.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.evidence.map((ev, idx) => {
                const isBefore = ['before', 'staff_before'].includes(ev.evidenceType);
                const isAfter = ['after', 'staff_after'].includes(ev.evidenceType);
                const badgeText = isBefore ? 'Before' : isAfter ? 'After (Proof)' : 'Additional';
                const badgeColor = isBefore
                  ? 'bg-amber-600'
                  : isAfter
                  ? 'bg-emerald-600'
                  : 'bg-royal';

                return (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto(ev.imageUrl)}
                    className="relative group rounded-xl overflow-hidden border border-sky/40 cursor-pointer aspect-video bg-slate-100 shadow-sm"
                  >
                    <img src={ev.imageUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                      <Maximize2 className="w-5 h-5 mb-1" />
                      {ev.caption && <span className="text-[10px] line-clamp-1 italic font-medium">"{ev.caption}"</span>}
                    </div>
                    <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${badgeColor} text-[9px] text-white font-bold uppercase shadow-sm`}>
                      {badgeText}
                    </span>
                    {ev.submissionRound > 1 && (
                      <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-purple-700 text-[9px] text-white font-bold">
                        R{ev.submissionRound}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback Display if Resolved */}
        {feedback && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Student Review: {feedback.rating} / 5 Stars</span>
            </div>
            {feedback.comment && <p className="italic">"{feedback.comment}"</p>}
          </div>
        )}
      </div>

      {/* Add Notes & Progress Updates Card */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-navy flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-royal" />
          <span>Post Updates & Internal Notes</span>
        </h2>

        <form onSubmit={handleAddNotes} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-royal" />
                <span>Public Progress Update (visible to student)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Technician Rajesh Kumar has acquired the replacement valve..."
                value={quickPublicNote}
                onChange={(e) => setQuickPublicNote(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5 flex items-center gap-1.5 text-slate-700">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Internal Administrative Note (Private - wardens only)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Invoiced ₹850 under hostel contingency budget #204..."
                value={quickInternalNote}
                onChange={(e) => setQuickInternalNote(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-medium bg-amber-50/40 border-amber-200"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addingNote || (!quickPublicNote.trim() && !quickInternalNote.trim())}
              className="btn-action px-5 py-2 rounded-control text-xs font-bold shadow-md"
            >
              {addingNote ? 'Recording...' : 'Post Note / Update'}
            </button>
          </div>
        </form>
      </div>

      {/* Full Audit Timeline History (Displaying Both Public & Internal Notes) */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-heading font-bold text-navy flex items-center gap-2">
          <Clock className="w-5 h-5 text-royal" />
          <span>Administrative Audit Trail & Lifecycle History</span>
        </h2>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky/40">
          {history.map((item, idx) => (
            <div key={item._id || idx} className="relative group">
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-navy border-2 border-white shadow-sm" />
              <div className="glass-card p-4 text-xs space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-navy">
                    {item.actionType === 'Created'
                      ? 'Complaint Logged'
                      : item.actionType === 'StaffAssigned'
                      ? 'Staff Assigned'
                      : item.actionType === 'StatusChange'
                      ? `Status Changed to ${item.newValue}`
                      : item.actionType === 'PriorityChange'
                      ? `Priority Changed to ${item.newValue}`
                      : item.actionType}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                {item.publicNote && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-sky/30 text-slate-700">
                    <span className="text-[10px] font-bold text-royal uppercase tracking-wider block mb-0.5">
                      Public Update
                    </span>
                    <p>"{item.publicNote}"</p>
                  </div>
                )}

                {item.internalNote && (
                  <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-300 text-amber-900">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <Lock className="w-3 h-3" />
                      <span>Internal Admin Note</span>
                    </span>
                    <p>"{item.internalNote}"</p>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Recorded by: <span className="font-semibold text-slate-600">{item.performedByName}</span> ({item.performedByRole})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Lightbox Modal --- */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-ice p-2"
            >
              <X className="w-7 h-7" />
            </button>
            <img src={activePhoto} alt="Full view" className="w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* --- Modals for Status, Priority, Staff --- */}
      {activeModal === 'status' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-ice pb-3">
              <h3 className="font-heading font-bold text-base text-navy">Update Complaint Status</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="glass-input w-full p-2.5 text-xs font-medium">
                  <option value="Submitted">Submitted</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  {newStatus === 'Resolved' ? 'Resolution Notes (visible to student)' : newStatus === 'Rejected' ? 'Rejection Reason (required)' : 'Public Note'}
                </label>
                <textarea rows={2} required={newStatus === 'Rejected'} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="glass-input w-full p-2.5 text-xs font-medium" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary px-4 py-2 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={modalLoading} className="btn-action px-5 py-2 text-xs font-bold shadow-md">{modalLoading ? 'Saving...' : 'Update Status'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'priority' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-ice pb-3">
              <h3 className="font-heading font-bold text-base text-navy">Override Priority</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="glass-input w-full p-2.5 text-xs font-medium">
                  <option value="Critical">Critical (6h SLA)</option>
                  <option value="High">High (24h SLA)</option>
                  <option value="Medium">Medium (48h SLA)</option>
                  <option value="Low">Low (72h SLA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Reason for Adjustment</label>
                <textarea rows={2} required value={priorityReason} onChange={(e) => setPriorityReason(e.target.value)} className="glass-input w-full p-2.5 text-xs font-medium" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary px-4 py-2 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={modalLoading} className="btn-action px-5 py-2 text-xs font-bold shadow-md">{modalLoading ? 'Saving...' : 'Apply'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'assign' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-ice pb-3">
              <h3 className="font-heading font-bold text-base text-navy">Assign Maintenance Staff</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Staff Member</label>
                <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="glass-input w-full p-2.5 text-xs font-medium">
                  <option value="">-- Select Staff --</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.specialization})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary px-4 py-2 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={modalLoading || !selectedStaffId} className="btn-action px-5 py-2 text-xs font-bold shadow-md">{modalLoading ? 'Assigning...' : 'Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaintDetail;
