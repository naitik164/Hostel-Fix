import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  PlusCircle,
  Wrench,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  Filter,
  X,
  Briefcase,
  AlertCircle,
  Mail,
  Building,
  Shield,
  RotateCcw,
  Check,
} from 'lucide-react';

const SPECIALIZATIONS = [
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Cleaning & Hygiene',
  'Mess & Food',
  'Internet & IT',
  'Security',
  'General Maintenance',
];

const CAMPUS_BLOCKS = [
  'A-Block (Godavari)',
  'B-Block (Krishna)',
  'C-Block (Kaveri)',
  'D-Block (Ganga)',
  'E-Block (Narmada)',
];

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specFilter, setSpecFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('Electrical');
  const [department, setDepartment] = useState('');
  const [assignedBlocks, setAssignedBlocks] = useState([]);
  const [resetGoogleLink, setResetGoogleLink] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (specFilter !== 'all') params.department = specFilter;

      const res = await api.get('/admin/staff', { params });
      if (res.data && res.data.success) {
        setStaff(res.data.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [statusFilter, specFilter]);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setSpecialization('Electrical');
    setDepartment('Electrical');
    setAssignedBlocks([]);
    setResetGoogleLink(false);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setName(member.name);
    setEmployeeId(member.employeeId);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setSpecialization(member.specialization);
    setDepartment(member.department || member.specialization);
    setAssignedBlocks(member.assignedBlocks || []);
    setResetGoogleLink(false);
    setError('');
    setModalOpen(true);
  };

  const handleBlockToggle = (blockName) => {
    setAssignedBlocks((prev) =>
      prev.includes(blockName) ? prev.filter((b) => b !== blockName) : [...prev, blockName]
    );
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Staff name and approved Google email are required.');
      return;
    }

    try {
      setModalLoading(true);
      setError('');
      if (editingStaff) {
        await api.patch(`/admin/staff/${editingStaff._id}`, {
          name,
          email,
          phone,
          specialization,
          department: department || specialization,
          assignedBlocks,
          resetGoogleLink,
        });
      } else {
        await api.post('/admin/staff', {
          name,
          employeeId,
          email,
          phone,
          specialization,
          department: department || specialization,
          assignedBlocks,
        });
      }
      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleStatus = async (member) => {
    try {
      await api.patch(`/admin/staff/${member._id}`, {
        isActive: !member.isActive,
      });
      fetchStaff();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-2">
            <span>Maintenance Staff Management</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-ice text-royal border border-sky/40">
              {staff.length} technicians
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize staff profiles with Google accounts, manage trade specializations, assigned hostel blocks, and inspect workloads
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-action inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold shadow-md self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Staff Member</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-navy">Filter:</span>
          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="glass-input px-3 py-1.5 text-xs font-medium"
          >
            <option value="all">All Specializations</option>
            {SPECIALIZATIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3 py-1.5 text-xs font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>

        <span className="text-slate-400 text-xs">
          Passcode-free Google OAuth authorization enforced for all staff
        </span>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-electric" />
          <p className="text-xs">Fetching maintenance staff roster...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="py-20 text-center glass-card p-6 text-slate-500">
          No staff members found matching filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div
              key={member._id}
              className={`glass-card p-6 flex flex-col justify-between transition-all ${
                !member.isActive ? 'opacity-60 bg-slate-100/50' : 'hover:shadow-glass-hover'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-action text-white flex items-center justify-center shadow-md">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy text-sm sm:text-base">{member.name}</h3>
                      <p className="font-mono text-[11px] text-royal font-semibold">
                        {member.employeeId}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      member.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {/* Google Email & Identity status */}
                <div className="mt-4 p-2.5 rounded-xl bg-blue-50/70 border border-sky/30 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-navy truncate">
                    <Mail className="w-3.5 h-3.5 text-royal shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Google Link:</span>
                    <span className={member.googleSub ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                      {member.googleSub ? 'Linked (Verified)' : 'Pending First Sign-In'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 bg-white/60 p-2 rounded-xl border border-sky/20">
                    <span className="font-medium">Specialization</span>
                    <span className="font-bold text-navy">{member.specialization}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 bg-white/60 p-2 rounded-xl border border-sky/20">
                    <span className="font-medium">Active Workload</span>
                    <span className="font-bold text-electric">
                      {member.activeWorkload || 0} active ticket(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 bg-white/60 p-2 rounded-xl border border-sky/20">
                    <span className="font-medium">Completed & Verified</span>
                    <span className="font-bold text-emerald-700">
                      {member.completedCount || 0} resolved
                    </span>
                  </div>

                  {member.assignedBlocks && member.assignedBlocks.length > 0 && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      <span className="font-semibold text-navy">Assigned Blocks: </span>
                      <span>{member.assignedBlocks.join(', ')}</span>
                    </div>
                  )}

                  {member.phone && (
                    <div className="flex items-center gap-2 text-slate-500 pt-0.5">
                      <Phone className="w-3.5 h-3.5 text-royal" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-ice/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(member)}
                  className="btn-secondary flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => toggleStatus(member)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    member.isActive
                      ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {member.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Add / Edit Modal --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 sm:p-8 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ice/80 pb-3">
              <h3 className="font-heading font-bold text-base text-navy">
                {editingStaff ? 'Edit Staff Profile' : 'Register New Maintenance Staff Profile'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Yadav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">
                    Unique Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-E101"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-medium uppercase font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Administrative ID for internal records.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Approved Google Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.maintenance@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Staff member MUST log in using this approved Google account. Password login is disabled for security.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">
                    Trade Specialization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => {
                      setSpecialization(e.target.value);
                      if (!department) setDepartment(e.target.value);
                    }}
                    className="glass-input w-full p-2.5 text-xs font-medium"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 11002"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Assigned Hostel Blocks */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Assigned Hostel Blocks (Field Coverage)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-blue-50/50 border border-sky/20">
                  {CAMPUS_BLOCKS.map((block) => (
                    <label key={block} className="flex items-center gap-2 cursor-pointer text-xs text-navy">
                      <input
                        type="checkbox"
                        checked={assignedBlocks.includes(block)}
                        onChange={() => handleBlockToggle(block)}
                        className="rounded text-electric focus:ring-electric"
                      />
                      <span>{block}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingStaff && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                    <input
                      type="checkbox"
                      checked={resetGoogleLink}
                      onChange={(e) => setResetGoogleLink(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Reset Google Account Linking</span>
                  </label>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Check this if the staff member switched their Google account or needs to re-authorize from scratch.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-ice/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-action px-5 py-2 text-xs font-bold shadow-md"
                >
                  {modalLoading ? 'Saving...' : editingStaff ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;
