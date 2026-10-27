import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Building,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';

const StudentProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [name, setName] = useState(user?.name || '');
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || 'Block A');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/student/dashboard');
        if (res.data && res.data.blocks) {
          setBlocks(res.data.blocks);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchBlocks();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await updateUserProfile({
        name,
        hostelBlock,
        roomNumber,
        phone,
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading">Student Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your verified hostel room assignment and contact credentials
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={
            user?.profilePhoto ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          }
          alt={user?.name}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-sky shadow-md"
        />
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-navy">{user?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ice text-royal border border-sky/40">
              Verified Student
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-royal" />
              <span>{user?.hostelBlock ? `${user.hostelBlock} • Room ${user.roomNumber}` : 'Hostel Unassigned'}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Identity Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card p-6 sm:p-8">
        <h3 className="text-base font-bold text-navy mb-4 border-b border-ice/80 pb-3">
          Hostel Room & Residency Information
        </h3>

        {success && (
          <div className="mb-4 p-3 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Official Student Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="glass-input w-full px-3.5 py-2.5 text-xs font-medium bg-slate-100/70 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Hostel Block</label>
              <select
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
              >
                {blocks.length > 0 ? (
                  blocks.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name} ({b.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Aryabhata Block">Aryabhata Block (Block A)</option>
                    <option value="Kalam Bhavan">Kalam Bhavan (Block B)</option>
                    <option value="Ramanujan Hall">Ramanujan Hall (Block C)</option>
                    <option value="Visvesvaraya Block">Visvesvaraya Block (Block D)</option>
                    <option value="Sarojini Naidu Hall">Sarojini Naidu Hall (Block E)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Room Number</label>
              <input
                type="text"
                placeholder="e.g. A-304"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">Contact Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
            />
          </div>

          <div className="pt-4 border-t border-ice/80 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-action flex items-center gap-2 px-6 py-2.5 rounded-control text-xs font-bold shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
