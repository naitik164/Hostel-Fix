import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  Search,
  Filter,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Food Quality & Mess',
  'Drinking Water',
  'Plumbing & Washroom',
  'Electricity & Lighting',
  'Cleanliness & Hygiene',
  'Room Maintenance',
  'Furniture & Fixtures',
  'Internet & Wi-Fi',
  'Security & Safety',
  'Pest Control',
  'Common Area Maintenance',
  'Other',
];

const AdminComplaints = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState('All Categories');
  const [hostelBlock, setHostelBlock] = useState('all');
  const [priority, setPriority] = useState('all');
  const [assignedStaff, setAssignedStaff] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'priority' | 'assign'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal form values
  const [newStatus, setNewStatus] = useState('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [priorityReason, setPriorityReason] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const fetchStaffAndBlocks = async () => {
    try {
      const [staffRes, blocksRes] = await Promise.allSettled([
        api.get('/admin/staff'),
        api.get('/admin/blocks'),
      ]);
      if (staffRes.status === 'fulfilled' && staffRes.value.data?.staff) {
        setStaffList(staffRes.value.data.staff);
      }
      if (blocksRes.status === 'fulfilled' && blocksRes.value.data?.blocks) {
        setBlocks(blocksRes.value.data.blocks);
      }
    } catch (e) {
      console.error('Failed to load staff/blocks:', e);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 12,
        status: status !== 'all' ? status : undefined,
        category: category !== 'All Categories' ? category : undefined,
        hostelBlock: hostelBlock !== 'all' ? hostelBlock : undefined,
        priority: priority !== 'all' ? priority : undefined,
        assignedStaff: assignedStaff !== 'all' ? assignedStaff : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
      };

      const res = await api.get('/admin/complaints', { params });
      if (res.data && res.data.success) {
        setComplaints(res.data.complaints);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load admin complaints:', err);
      setError(err.response?.data?.message || 'Failed to load complaints from database. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndBlocks();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, status, category, hostelBlock, priority, assignedStaff, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  // Export to CSV
  const handleExportCsv = () => {
    const query = new URLSearchParams({
      status: status !== 'all' ? status : '',
      category: category !== 'All Categories' ? category : '',
      hostelBlock: hostelBlock !== 'all' ? hostelBlock : '',
      priority: priority !== 'all' ? priority : '',
      startDate,
      endDate,
    }).toString();
    window.open(`${api.defaults.baseURL}/admin/reports/export?${query}`, '_blank');
  };

  // Open modals
  const openStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusNote('');
    setInternalNote('');
    setActiveModal('status');
  };

  const openPriorityModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewPriority(complaint.priority);
    setPriorityReason('');
    setActiveModal('priority');
  };

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedStaffId(complaint.assignedStaffId?._id || '');
    setActiveModal('assign');
  };

  // Handle modal submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      setModalLoading(true);
      await api.patch(`/admin/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        publicNote: statusNote,
        internalNote,
        resolutionNotes: newStatus === 'Resolved' ? statusNote : undefined,
        rejectedReason: newStatus === 'Rejected' ? statusNote : undefined,
      });
      setActiveModal(null);
      fetchComplaints();
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      setModalLoading(true);
      await api.patch(`/admin/complaints/${selectedComplaint._id}/priority`, {
        priority: newPriority,
        priorityReason,
      });
      setActiveModal(null);
      fetchComplaints();
    } catch (err) {
      alert('Error updating priority: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !selectedStaffId) return;
    try {
      setModalLoading(true);
      await api.patch(`/admin/complaints/${selectedComplaint._id}/assignment`, {
        staffId: selectedStaffId,
      });
      setActiveModal(null);
      fetchComplaints();
    } catch (err) {
      alert('Error assigning staff: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-2">
            <span>Complaints Repository</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-ice text-royal border border-sky/40">
              {totalCount} total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, prioritize, and assign maintenance personnel
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Comprehensive Filter Controls */}
      <div className="glass-card p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, title, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-9 pr-3 py-2 text-xs w-full"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (Awaiting Review)</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Hostel Block */}
          <select
            value={hostelBlock}
            onChange={(e) => {
              setHostelBlock(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full"
          >
            <option value="all">All Hostel Blocks</option>
            {blocks.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Assigned Staff */}
          <select
            value={assignedStaff}
            onChange={(e) => {
              setAssignedStaff(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full"
          >
            <option value="all">All Staff Members</option>
            <option value="unassigned">Unassigned Only</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.specialization})
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full text-slate-600"
            title="From Date"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs w-full text-slate-600"
            title="To Date"
          />
        </form>
      </div>

      {/* API Error Notification & Retry */}
      {error && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchComplaints}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Complaints Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-600 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-electric" />
            <p className="text-xs">Querying MongoDB repository...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-20 text-center p-6 text-slate-500">
            No complaints found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Student</th>
                  <th>Title & Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} className="transition-colors">
                    <td className="font-mono font-bold text-xs text-royal">{c.referenceId}</td>
                    <td>
                      <div className="font-semibold text-navy text-xs">{c.studentId?.name || 'Student'}</div>
                      <div className="text-xs text-slate-600 font-medium">{c.studentId?.email}</div>
                    </td>
                    <td>
                      <div className="font-medium text-navy max-w-xs truncate text-xs">{c.title}</div>
                      <div className="text-xs text-slate-600 font-medium">{c.category}</div>
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.hostelBlockName} {c.roomNumber ? `• ${c.roomNumber}` : ''}
                    </td>
                    <td>
                      <button
                        onClick={() => openPriorityModal(c)}
                        title="Click to override priority"
                        className="hover:scale-105 transition-transform"
                      >
                        <PriorityBadge priority={c.priority} />
                      </button>
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.assignedStaffId ? (
                        <button
                          onClick={() => openAssignModal(c)}
                          className="hover:underline text-left"
                          title="Click to reassign"
                        >
                          <div className="font-medium text-navy">{c.assignedStaffId.name}</div>
                          <div className="text-xs text-slate-600 font-medium">
                            {c.assignedStaffId.specialization}
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => openAssignModal(c)}
                          className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100"
                        >
                          + Assign Staff
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => openStatusModal(c)}
                        title="Click to update status"
                        className="hover:scale-105 transition-transform"
                      >
                        <StatusBadge status={c.status} />
                      </button>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/admin/complaints/${c._id}`}
                        className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-ice/60 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-secondary p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL: Update Status --- */}
      {activeModal === 'status' && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-modal max-w-lg w-full p-5 sm:p-8 space-y-4 sm:space-y-5 animate-in fade-in max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ice/80 pb-3 sm:pb-4">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-navy">Update Complaint Status</h2>
                <p className="text-xs text-slate-600 font-mono font-medium">{selectedComplaint.referenceId}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-600 hover:text-navy p-1 touch-target flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  <option value="Submitted">Submitted (Awaiting Review)</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  {newStatus === 'Resolved'
                    ? 'Resolution Notes (visible to student)'
                    : newStatus === 'Rejected'
                    ? 'Rejection Reason (required - visible to student)'
                    : 'Public Update Note (visible to student)'}
                </label>
                <textarea
                  rows={2}
                  required={newStatus === 'Rejected'}
                  placeholder={
                    newStatus === 'Resolved'
                      ? 'Describe how the repair or maintenance was successfully finished...'
                      : newStatus === 'Rejected'
                      ? 'Explain why this complaint was rejected...'
                      : 'Provide a progress update to the student...'
                  }
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Internal Administrative Note (Private to wardens)
                </label>
                <input
                  type="text"
                  placeholder="Optional internal remarks for the hostel records..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="pt-4 border-t border-ice/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-secondary px-4 py-2 rounded-control text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-action px-5 py-2 rounded-control text-xs font-bold shadow-md"
                >
                  {modalLoading ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Override Priority --- */}
      {activeModal === 'priority' && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-modal max-w-md w-full p-5 sm:p-8 space-y-4 sm:space-y-5 animate-in fade-in max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ice/80 pb-3 sm:pb-4">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-navy">Override Priority</h2>
                <p className="text-xs text-slate-600 font-mono font-medium">{selectedComplaint.referenceId}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-600 hover:text-navy p-1 touch-target flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  <option value="Critical">Critical (Immediate 6h SLA)</option>
                  <option value="High">High (24h SLA)</option>
                  <option value="Medium">Medium (48h SLA)</option>
                  <option value="Low">Low (72h SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Reason for Priority Adjustment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Record reason (e.g. Safety hazard confirmed by physical inspection)..."
                  value={priorityReason}
                  onChange={(e) => setPriorityReason(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="pt-4 border-t border-ice/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-secondary px-4 py-2 rounded-control text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-action px-5 py-2 rounded-control text-xs font-bold shadow-md"
                >
                  {modalLoading ? 'Saving...' : 'Apply Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Assign Staff --- */}
      {activeModal === 'assign' && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-modal max-w-md w-full p-5 sm:p-8 space-y-4 sm:space-y-5 animate-in fade-in max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ice/80 pb-3 sm:pb-4">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-navy">Assign Maintenance Personnel</h2>
                <p className="text-xs text-slate-600 font-mono font-medium">{selectedComplaint.referenceId}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-600 hover:text-navy p-1 touch-target flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Select Technician ({selectedComplaint.category})
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.specialization} ({s.activeWorkload || 0} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-ice/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn-secondary px-4 py-2 rounded-control text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !selectedStaffId}
                  className="btn-action px-5 py-2 rounded-control text-xs font-bold shadow-md"
                >
                  {modalLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
