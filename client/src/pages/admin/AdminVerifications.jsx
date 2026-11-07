import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  Building,
  MapPin,
  Calendar,
  User,
  HardHat,
  Eye,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  Flame,
  Shield,
  Loader2,
} from 'lucide-react';

const AdminVerifications = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Verification modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [verificationAction, setVerificationAction] = useState('approve'); // 'approve' | 'request_rework'
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;

      const res = await api.get('/admin/verifications', { params });
      if (res.data && res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending verifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVerifications();
  };

  const openVerifyModal = (complaint, action) => {
    setSelectedComplaint(complaint);
    setVerificationAction(action);
    setResolutionNotes(action === 'approve' ? 'Work inspected and approved by warden.' : '');
    setReworkReason('');
    setActionSuccess('');
  };

  const handleConfirmVerification = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (verificationAction === 'request_rework' && !reworkReason.trim()) {
      alert('A mandatory rework explanation must be provided to instruct the technician.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const res = await api.patch(`/admin/complaints/${selectedComplaint._id}/verification`, {
        action: verificationAction,
        resolutionNotes: resolutionNotes.trim(),
        reworkReason: reworkReason.trim(),
      });

      if (res.data && res.data.success) {
        setActionSuccess(
          verificationAction === 'approve'
            ? `Complaint ${selectedComplaint.referenceId} has been successfully verified and marked Resolved!`
            : `Rework requested on ${selectedComplaint.referenceId}. Staff has been notified.`
        );
        setSelectedComplaint(null);
        await fetchVerifications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
              <span>Pending Task Verifications</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review staff work notes and photographic evidence before approving resolution
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search Reference, title, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-sky/30 text-xs font-medium text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchVerifications} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-3 sm:p-4 border border-white/80 shadow-glass flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-royal" />
            <span>Category:</span>
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-sky/30 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-purple-600"
          >
            <option value="all">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Cleaning & Hygiene">Cleaning & Hygiene</option>
            <option value="Mess & Food">Mess & Food</option>
            <option value="Internet & IT">Internet & IT</option>
            <option value="Security">Security</option>
            <option value="General Maintenance">General Maintenance</option>
          </select>
        </div>

        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
          {complaints.length} Task{complaints.length !== 1 ? 's' : ''} Awaiting Review
        </span>
      </div>

      {/* Listing */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/60 border border-white animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/80 shadow-glass">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-navy">All Work Verified</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are no complaints currently awaiting warden verification. When field staff submit photo proof of completed repairs, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {complaints.map((c) => {
            const studentPhotos = c.images || [];
            const beforePhotos = (c.evidence || []).filter((e) =>
              ['before', 'staff_before'].includes(e.evidenceType)
            );
            const afterPhotos = (c.evidence || []).filter((e) =>
              ['after', 'staff_after'].includes(e.evidenceType)
            );
            const otherPhotos = (c.evidence || []).filter((e) =>
              ['additional', 'staff_additional_evidence'].includes(e.evidenceType)
            );

            return (
              <div
                key={c._id}
                className="glass-card p-6 border-2 border-purple-200/80 shadow-glass space-y-5 relative"
              >
                {/* Header Information */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                        {c.referenceId}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-600 text-white">
                        Pending Verification
                      </span>
                      {c.reworkCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          Rework Round #{c.reworkCount + 1}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-semibold">
                        • {c.category} › {c.subcategory || 'General'}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-navy">{c.title}</h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-navy">
                        <Building className="w-3.5 h-3.5 text-royal" />
                        <span>{c.hostelBlockName}</span>
                      </span>
                      {c.roomNumber && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-royal" />
                          <span>Room {c.roomNumber}</span>
                        </span>
                      )}
                      {c.studentId && (
                        <span>Student: <strong className="text-navy">{c.studentId.name}</strong></span>
                      )}
                      {c.assignedStaffId && (
                        <span className="inline-flex items-center gap-1 text-royal font-semibold">
                          <HardHat className="w-3.5 h-3.5" />
                          <span>Staff: {c.assignedStaffId.name} ({c.assignedStaffId.specialization})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verification Decision Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => openVerifyModal(c, 'approve')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/30"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Resolve</span>
                    </button>
                    <button
                      onClick={() => openVerifyModal(c, 'request_rework')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 text-xs font-bold transition-all"
                    >
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>Request Rework</span>
                    </button>
                  </div>
                </div>

                {/* Staff Completion Notes */}
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 block">
                    Staff Completion Notes
                  </span>
                  <p className="text-xs text-purple-950 font-medium leading-relaxed">
                    "{c.completionNotes || 'No notes provided by staff.'}"
                  </p>
                  {c.reasonForNoBeforePhoto && (
                    <p className="text-[11px] text-amber-800 pt-1">
                      <strong>Exception note:</strong> {c.reasonForNoBeforePhoto}
                    </p>
                  )}
                </div>

                {/* Before and After Photo Comparison */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-royal" />
                    <span>Photo Proof Inspection</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Student Initial Complaint Photos */}
                    <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
                      <span className="text-[11px] font-black uppercase text-royal flex items-center justify-between">
                        <span>Resident Photos</span>
                        <span className="text-[10px] text-slate-500">({studentPhotos.length})</span>
                      </span>
                      {studentPhotos.length === 0 ? (
                        <div className="aspect-video rounded-xl bg-white border border-sky-200 flex items-center justify-center text-xs text-slate-400 italic">
                          No initial photos submitted
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {studentPhotos.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="aspect-square rounded-xl overflow-hidden border border-sky/30 group relative block"
                            >
                              <img src={url} alt={`Resident ${idx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                View
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Staff Before Photos */}
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                      <span className="text-[11px] font-black uppercase text-amber-900 flex items-center justify-between">
                        <span>Staff Before Repair</span>
                        <span className="text-[10px] text-amber-700">({beforePhotos.length})</span>
                      </span>
                      {beforePhotos.length === 0 ? (
                        <div className="aspect-video rounded-xl bg-white border border-amber-200 flex items-center justify-center text-xs text-amber-800 italic">
                          No before photo taken
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {beforePhotos.map((p, idx) => (
                            <a
                              key={idx}
                              href={p.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="aspect-square rounded-xl overflow-hidden border border-amber-300 group relative block"
                            >
                              <img src={p.imageUrl} alt="Before" className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                View
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Staff After Photos (Completion Proof) */}
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <span className="text-[11px] font-black uppercase text-emerald-900 flex items-center justify-between">
                        <span>Staff After Repair</span>
                        <span className="text-[10px] text-emerald-700">({afterPhotos.length})</span>
                      </span>
                      {afterPhotos.length === 0 ? (
                        <div className="aspect-video rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xs text-emerald-800 italic">
                          No completion photo submitted
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {afterPhotos.map((p, idx) => (
                            <a
                              key={idx}
                              href={p.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="aspect-square rounded-xl overflow-hidden border border-emerald-300 group relative block"
                            >
                              <img src={p.imageUrl} alt="After" className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                View
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer link to full complaint record */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Submitted on {new Date(c.pendingVerificationAt || c.updatedAt).toLocaleString()}
                  </span>
                  <Link
                    to={`/admin/complaints/${c._id}`}
                    className="font-bold text-royal hover:underline"
                  >
                    View Complaint Record & History →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg glass-card p-5 sm:p-8 border border-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky/20">
              <div className="flex items-center gap-2">
                {verificationAction === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Flame className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-base font-bold text-navy font-heading">
                  {verificationAction === 'approve'
                    ? `Approve & Resolve ${selectedComplaint.referenceId}`
                    : `Request Rework on ${selectedComplaint.referenceId}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1 touch-target flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmVerification} className="space-y-4 text-xs">
              {verificationAction === 'approve' ? (
                <>
                  <div>
                    <label className="font-bold text-navy block mb-1">
                      Resolution Notes (Visible to Student & Staff)
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="e.g. Work inspected and verified. Repair meets hostel standards."
                      className="w-full p-3 rounded-xl bg-white border border-sky/30 text-navy text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                    Approving marks the complaint <strong>Resolved</strong> in both the Student Portal and Warden Portal. The student will be prompted to rate resolution quality.
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-rose-900 block mb-1">
                      Mandatory Rework Explanation <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reworkReason}
                      onChange={(e) => setReworkReason(e.target.value)}
                      placeholder="Explain specifically what needs to be fixed (e.g. Paint finish incomplete around light switch; water still dripping slowly)..."
                      className="w-full p-3 rounded-xl bg-white border border-rose-300 text-navy text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                    Requesting rework changes the status to <strong>Rework Required</strong> and immediately alerts the technician with your feedback. Previous photo evidence will be archived for audit.
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md ${
                    verificationAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  }`}
                >
                  {actionLoading
                    ? 'Processing...'
                    : verificationAction === 'approve'
                    ? 'Confirm Sign-Off'
                    : 'Send Rework Instructions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
