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

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specFilter, setSpecFilter] = useState('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('Electrical');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/staff');
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
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setEmployeeId('');
    setPhone('');
    setSpecialization('Electrical');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setName(member.name);
    setEmployeeId(member.employeeId);
    setPhone(member.phone || '');
    setSpecialization(member.specialization);
    setError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setError('');
      if (editingStaff) {
        await api.patch(`/admin/staff/${editingStaff._id}`, {
          name,
          phone,
          specialization,
        });
      } else {
        await api.post('/admin/staff', {
          name,
          employeeId,
          phone,
          specialization,
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

  const filteredStaff = staff.filter(
    (s) => specFilter === 'all' || s.specialization === specFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-2">
            <span>Maintenance Staff</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-ice text-royal border border-sky/40">
              {staff.length} technicians
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage hostel facility technicians, trade specializations, and active assigned workloads
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-action inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter by Specialization */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-navy">Filter Specialization:</span>
        <select
          value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value)}
          className="glass-input px-3 py-1.5 text-xs font-medium"
        >
          <option value="all">All Specializations ({staff.length})</option>
          {SPECIALIZATIONS.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-electric" />
          <p className="text-xs">Fetching maintenance staff roster...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-20 text-center glass-card p-6 text-slate-500">
          No staff members found matching specialization filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
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
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      member.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 bg-white/60 p-2.5 rounded-xl border border-sky/20">
                    <span className="font-medium">Specialization</span>
                    <span className="font-bold text-navy">{member.specialization}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 bg-white/60 p-2.5 rounded-xl border border-sky/20">
                    <span className="font-medium">Current Workload</span>
                    <span className="font-bold text-electric">
                      {member.activeWorkload || 0} active ticket(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 pt-1">
                    <Phone className="w-3.5 h-3.5 text-royal" />
                    <span>{member.phone || 'No phone recorded'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-ice/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(member)}
                  className="btn-secondary flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
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
          <div className="glass-modal max-w-md w-full p-6 sm:p-8 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-ice/80 pb-3">
              <h3 className="font-heading font-bold text-base text-navy">
                {editingStaff ? 'Edit Staff Member' : 'Register New Maintenance Staff'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Staff Full Name</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-P202"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-medium uppercase"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
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
                  {modalLoading ? 'Saving...' : editingStaff ? 'Save Changes' : 'Create Staff'}
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
