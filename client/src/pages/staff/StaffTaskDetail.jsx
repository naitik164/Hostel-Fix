import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Play,
  XCircle,
  Camera,
  History,
  Shield,
  User,
  MessageSquare,
  HelpCircle,
  Flame,
  Loader2,
} from 'lucide-react';

const StaffTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Photo Evidence Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [evidenceType, setEvidenceType] = useState('after');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Verification Submission Modal / State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [reasonForNoBeforePhoto, setReasonForNoBeforePhoto] = useState('');

  // Unable to Complete Modal State
  const [showUnableModal, setShowUnableModal] = useState(false);
  const [unableReason, setUnableReason] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/staff/tasks/${id}`);
      if (res.data && res.data.success) {
        setTask(res.data.task);
        setHistory(res.data.history || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  // Handle Photo selection & previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (files.length > 4) {
      alert('You can upload a maximum of 4 photos at once.');
      return;
    }

    setSelectedFiles(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) {
      alert('Please select at least one photograph to upload.');
      return;
    }

    try {
      setUploadingPhotos(true);
      setActionSuccess('');
      setError('');

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('evidenceType', evidenceType);
      if (photoCaption.trim()) {
        formData.append('caption', photoCaption.trim());
      }

      const res = await api.post(`/staff/tasks/${id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (res.data && res.data.success) {
        setActionSuccess('Photo proof uploaded successfully!');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setPhotoCaption('');
        setUploadProgress(0);
        await fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo evidence.');
      setUploadProgress(0);
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Step Actions
  const handleAcceptTask = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.patch(`/staff/tasks/${id}/accept`);
      if (res.data && res.data.success) {
        setActionSuccess('Task accepted successfully! You can now start work on site.');
        await fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.patch(`/staff/tasks/${id}/start`);
      if (res.data && res.data.success) {
        setActionSuccess('Work marked as In Progress. Please document progress and capture completion photos.');
        await fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark work started.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!completionNotes.trim()) {
      alert('Please enter completion notes describing the maintenance work completed.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const res = await api.post(`/staff/tasks/${id}/submit-verification`, {
        completionNotes: completionNotes.trim(),
        reasonForNoBeforePhoto: reasonForNoBeforePhoto.trim(),
      });

      if (res.data && res.data.success) {
        setActionSuccess('Task submitted for warden verification! The warden has been notified to review and sign off.');
        setShowVerificationModal(false);
        await fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportUnableToComplete = async (e) => {
    e.preventDefault();
    if (!unableReason.trim()) {
      alert('Please provide a mandatory reason explaining the impediment.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const res = await api.post(`/staff/tasks/${id}/unable-to-complete`, {
        reason: unableReason.trim(),
      });

      if (res.data && res.data.success) {
        setActionSuccess('Status updated. Warden has been alerted regarding the impediment.');
        setShowUnableModal(false);
        await fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report impediment.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (s) => {
    const map = {
      'Assigned': 'bg-blue-100 text-blue-800 border-blue-300',
      'Accepted': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'In Progress': 'bg-amber-100 text-amber-800 border-amber-300',
      'Pending Verification': 'bg-purple-100 text-purple-800 border-purple-300',
      'Rework Required': 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
      'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Unable to Complete': 'bg-slate-200 text-slate-800 border-slate-300',
    };
    return map[s] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPriorityBadge = (p) => {
    const map = {
      Urgent: 'bg-rose-500 text-white',
      High: 'bg-amber-500 text-white',
      Medium: 'bg-blue-500 text-white',
      Low: 'bg-slate-400 text-white',
    };
    return map[p] || 'bg-blue-500 text-white';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="h-40 rounded-2xl bg-white/60 border border-white" />
        <div className="h-96 rounded-2xl bg-white/60 border border-white" />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="glass-card p-10 text-center border border-rose-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-navy">Unable to Load Task</h2>
        <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{error}</p>
        <Link
          to="/staff/tasks"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-electric text-white text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Tasks</span>
        </Link>
      </div>
    );
  }

  const evidenceList = task?.evidence || [];
  const currentRound = (task?.reworkCount || 0) + 1;
  const hasCurrentRoundEvidence = evidenceList.some(
    (e) => !e.submissionRound || e.submissionRound === currentRound
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/staff/tasks"
          className="inline-flex items-center gap-2 text-xs font-semibold text-royal hover:text-electric transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tasks</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(task.status)}`}>
            {task.status}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityBadge(task.priority)}`}>
            {task.priority} Priority
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rework Banner if applicable */}
      {task.status === 'Rework Required' && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-400 text-rose-950 shadow-md space-y-2">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-wide text-rose-800">
              Rework Required by Warden (Attempt #{task.reworkCount})
            </h3>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-rose-200">
            "{task.reworkReason}"
          </p>
          <p className="text-[11px] text-rose-700">
            Please perform the required adjustments on site, take updated photographs, and resubmit for verification.
          </p>
        </div>
      )}

      {/* Primary Task Information Card */}
      <div className="glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-sky/20">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-royal bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {task.referenceId}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {task.category} › {task.subcategory || 'General'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy font-heading">
              {task.title}
            </h1>
            <p className="text-xs text-slate-500">
              Submitted by Student on {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Quick Action Buttons according to current status */}
          <div className="flex flex-wrap items-center gap-2">
            {task.status === 'Assigned' && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleAcceptTask}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-electric text-white text-xs font-bold hover:bg-royal transition-all shadow-md shadow-electric/25"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Task</span>
                </button>
                <button
                  onClick={() => setShowUnableModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-all border border-slate-300"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>Report Blocker</span>
                </button>
              </>
            )}

            {(task.status === 'Accepted' || task.status === 'Rework Required') && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleStartWork}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all shadow-md shadow-amber-500/25"
                >
                  <Play className="w-4 h-4" />
                  <span>Mark Work Started</span>
                </button>
                <button
                  onClick={() => setShowUnableModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-all border border-slate-300"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>Report Blocker</span>
                </button>
              </>
            )}

            {task.status === 'In Progress' && (
              <>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit for Verification</span>
                </button>
                <button
                  onClick={() => setShowUnableModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-all border border-slate-300"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>Report Blocker</span>
                </button>
              </>
            )}

            {task.status === 'Pending Verification' && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Awaiting Warden Review</span>
              </div>
            )}

            {task.status === 'Resolved' && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified & Resolved</span>
              </div>
            )}
          </div>
        </div>

        {/* Location & Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-sky/20 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Location / Block</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-navy">
              <Building className="w-4 h-4 text-royal" />
              <span>{task.hostelBlockName}</span>
            </div>
            {task.roomNumber && (
              <p className="text-slate-600 mt-0.5">Room: {task.roomNumber}</p>
            )}
            {task.location && (
              <p className="text-slate-500 text-[11px]">{task.location}</p>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Student Contact</span>
            <p className="font-bold text-navy mt-1">{task.studentId?.name || 'N/A'}</p>
            <p className="text-slate-600 text-[11px]">{task.studentId?.email}</p>
            {task.studentId?.phone && (
              <p className="text-royal font-mono font-medium text-[11px]">{task.studentId.phone}</p>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Assignment Date</span>
            <p className="font-bold text-navy mt-1">
              {new Date(task.assignedAt || task.createdAt).toLocaleDateString()}
            </p>
            {task.assignedBy && (
              <p className="text-slate-500 text-[11px]">By Warden {task.assignedBy.name}</p>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Current Phase</span>
            <p className="font-bold text-royal mt-1">{task.status}</p>
            {task.startedAt && (
              <p className="text-slate-500 text-[11px]">
                Started: {new Date(task.startedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Problem Description
          </h2>
          <div className="p-4 rounded-2xl bg-white border border-sky/20 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {/* Warden Instructions (if any) */}
        {task.assignmentInstructions && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-royal flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-royal" />
              <span>Warden Instructions for Staff</span>
            </h2>
            <div className="p-4 rounded-2xl bg-royal/5 border border-royal/20 text-xs text-navy font-medium leading-relaxed">
              "{task.assignmentInstructions}"
            </div>
          </div>
        )}

        {/* Student's initial complaint photos (if provided) */}
        {task.images && task.images.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-royal" />
              <span>Student Submitted Photos ({task.images.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {task.images.map((img, idx) => (
                <a
                  key={idx}
                  href={img}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-sky/30 block group relative shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Student Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    View
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Proof & Evidence Management Section */}
      <div className="glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-sky/20">
          <div>
            <h2 className="text-lg font-extrabold text-navy font-heading flex items-center gap-2">
              <Camera className="w-5 h-5 text-electric" />
              <span>Work Evidence & Photo Proof</span>
            </h2>
            <p className="text-xs text-slate-500">
              Upload before, after, or parts photographs for warden verification
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Total Photos: <span className="text-royal font-mono">{evidenceList.length}</span>
          </div>
        </div>

        {/* Upload Form - Enabled when In Progress, Accepted, or Rework Required */}
        {['In Progress', 'Accepted', 'Rework Required'].includes(task.status) && (
          <form
            onSubmit={handleUploadEvidence}
            className="p-5 rounded-2xl bg-blue-50/60 border border-sky/30 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-royal">
                Upload Work Photo
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Photo Type:</span>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-sky/30 text-xs text-navy font-semibold focus:outline-none focus:ring-1 focus:ring-electric"
                >
                  <option value="staff_before">Before Work Photo (staff_before)</option>
                  <option value="staff_after">After Completion Photo (staff_after)</option>
                  <option value="staff_additional_evidence">Additional Proof (staff_additional_evidence)</option>
                </select>
              </div>
            </div>

            {/* File Input & Preview Box */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky/50 rounded-2xl bg-white/70 hover:bg-white transition-all text-center">
              <input
                type="file"
                id="photoProofInput"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="photoProofInput"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky/20 text-electric flex items-center justify-center shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-royal hover:underline">
                    Click to browse photos
                  </span>
                  <span className="text-xs text-slate-500"> or capture from mobile camera</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Supported formats: JPG, PNG, WEBP (Max 4 photos, 5MB each)
                </p>
              </label>
            </div>

            {/* Selected File Previews */}
            {previewUrls.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-600">
                  Ready to upload ({selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-sky/40 relative shadow-sm">
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono uppercase">
                        {evidenceType}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Optional caption / notes for these photos (e.g. Replaced faulty MCB switch)"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-sky/30 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-electric"
                  />
                  <button
                    type="submit"
                    disabled={uploadingPhotos}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-electric text-white text-xs font-bold hover:bg-royal transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo Proof</span>
                      </>
                    )}
                  </button>
                  {uploadingPhotos && (
                    <div className="w-full space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-bold text-royal">
                        <span>Uploading Photo Proof...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-royal to-electric transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        )}

        {/* Submitted Evidence Gallery */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Submitted Evidence Gallery
          </h3>

          {evidenceList.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
              <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No photo evidence uploaded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Before submitting for warden sign-off, at least one photo showing completed work is required.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {evidenceList.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden border border-sky/30 bg-white shadow-sm flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || `Proof photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      {(() => {
                        const isBefore = ['before', 'staff_before'].includes(item.evidenceType);
                        const isAfter = ['after', 'staff_after'].includes(item.evidenceType);
                        const label = isBefore ? 'Before Work' : isAfter ? 'After (Proof)' : 'Additional';
                        const color = isBefore ? 'bg-amber-600' : isAfter ? 'bg-emerald-600' : 'bg-royal';
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm ${color}`}>
                            {label}
                          </span>
                        );
                      })()}
                      {item.submissionRound && item.submissionRound > 1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-sm">
                          Round #{item.submissionRound}
                        </span>
                      )}
                    </div>
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                    >
                      Enlarge Photo
                    </a>
                  </div>

                  <div className="p-3 text-xs space-y-1 flex-1">
                    {item.caption ? (
                      <p className="font-semibold text-navy line-clamp-2">{item.caption}</p>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">No caption provided</p>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      Uploaded {new Date(item.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit History & Activity Trail */}
      <div className="glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-4">
        <h2 className="text-base font-extrabold text-navy font-heading flex items-center gap-2">
          <History className="w-4 h-4 text-royal" />
          <span>Task Status & Audit History</span>
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400">No action history recorded yet.</p>
        ) : (
          <div className="space-y-3.5 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-sky/30">
            {history.map((item) => (
              <div key={item._id} className="relative pl-7 text-xs">
                <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-electric border-2 border-white" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-navy">{item.actionType}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky/10 text-royal font-semibold">
                    {item.performedByRole ? item.performedByRole.toUpperCase() : 'USER'}: {item.performedByName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                {item.publicNote && (
                  <p className="text-slate-600 mt-1">{item.publicNote}</p>
                )}
                {item.internalNote && (
                  <p className="text-slate-500 italic mt-0.5 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                    Note: {item.internalNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Submission Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card p-6 sm:p-8 border border-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-sky/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-navy font-heading">
                  Submit Work for Warden Verification
                </h3>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-navy block mb-1">
                  Completion Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the maintenance steps completed, parts installed, or tests performed..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-sky/30 text-navy text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {!hasCurrentRoundEvidence && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs">
                  <span className="font-bold">Notice:</span> You must upload at least one photo proof above before submitting for verification.
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-600 block mb-1">
                  Reason if no before-work photo was captured (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Urgent active pipe burst required immediate intervention"
                  value={reasonForNoBeforePhoto}
                  onChange={(e) => setReasonForNoBeforePhoto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky/30 text-navy text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-sky/30 text-royal text-[11px] leading-relaxed">
                Submitting changes the status to <strong>Pending Verification</strong>. The Warden will review your photo evidence and either approve the resolution or request rework.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !hasCurrentRoundEvidence}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Confirm & Submit to Warden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unable to Complete Modal */}
      {showUnableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-6 sm:p-8 border border-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-rose-200">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-navy font-heading">
                  Report Blocker / Impediment
                </h3>
              </div>
              <button
                onClick={() => setShowUnableModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportUnableToComplete} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-navy block mb-1">
                  Reason Task Cannot Be Completed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Requires replacement capacitor not in stock; student room locked after 3 attempts..."
                  value={unableReason}
                  onChange={(e) => setUnableReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-rose-300 text-navy text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed">
                The Warden will be immediately alerted with high priority so they can arrange spare parts, issue campus instructions, or reassign the complaint.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Reporting...' : 'Notify Warden of Blocker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffTaskDetail;
