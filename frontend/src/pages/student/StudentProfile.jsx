import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Building,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  GraduationCap,
  Hash,
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const GENDERS = ['Male', 'Female', 'Other'];

const StudentProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const [blocks, setBlocks] = useState([]);

  // Editable Form Fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [collegeName, setCollegeName] = useState(user?.collegeName || 'LNCTE');
  const [branch, setBranch] = useState(user?.branch || '');
  const [academicYear, setAcademicYear] = useState(user?.academicYear || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || '');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [hostelAddress, setHostelAddress] = useState(user?.hostelAddress || 'LNCTE Campus, Bhopal');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Re-sync with user context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      setCollegeName(user.collegeName || 'LNCTE');
      setBranch(user.branch || '');
      setAcademicYear(user.academicYear || '');
      setRollNumber(user.rollNumber || '');
      setHostelBlock(user.hostelBlock || '');
      setRoomNumber(user.roomNumber || '');
      setHostelAddress(user.hostelAddress || 'LNCTE Campus, Bhopal');
    }
  }, [user]);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/student/blocks');
        if (res.data && res.data.blocks) {
          setBlocks(res.data.blocks);
        }
      } catch (err) {
        // Fallback to student dashboard if blocks route fails
        try {
          const dashRes = await api.get('/student/dashboard');
          if (dashRes.data && dashRes.data.blocks) {
            setBlocks(dashRes.data.blocks);
          }
        } catch (e) {
          // ignore
        }
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

      const cleanPhone = phone.replace(/[\s-]/g, '').trim();
      const indianPhoneRegex = /^[6-9]\d{9}$/;
      if (cleanPhone && !indianPhoneRegex.test(cleanPhone)) {
        throw new Error('Please enter a valid 10-digit Indian phone number.');
      }

      await updateUserProfile({
        name: name.trim(),
        phone: cleanPhone,
        gender,
        collegeName: collegeName.trim(),
        branch: branch.trim(),
        academicYear,
        rollNumber: rollNumber.trim(),
        hostelBlock: hostelBlock.trim(),
        roomNumber: roomNumber.trim(),
        hostelAddress: hostelAddress.trim(),
      });

      setSuccess('Student profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading">Student Profile</h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Manage your verified hostel room assignment, academic record, and contact details
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-card p-5 sm:p-7 md:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
        <UserAvatar
          src={user?.profilePhoto}
          name={user?.name}
          size="xl"
          className="rounded-2xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-navy truncate">{user?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9EDDA] text-[#20543F] border border-[#A8B99A]/40 shrink-0">
              Verified Student
            </span>
            {user?.profileCompleted && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Profile Complete</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1 truncate">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#20543F] shrink-0" />
              <span>{user?.hostelBlock ? `${user.hostelBlock} • Room ${user.roomNumber}` : 'Hostel Unassigned'}</span>
            </span>
            {user?.enrollmentNumber && (
              <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                <Hash className="w-3 h-3 text-slate-500" />
                <span>{user.enrollmentNumber}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              <span>Google Identity Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card p-6 sm:p-8">
        {success && (
          <div className="mb-6 p-3 rounded-control bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2 border-b border-ice/80 pb-2">
              <User className="w-4 h-4 text-[#20543F]" />
              <span>Personal Details</span>
            </h3>

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
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium bg-slate-100/70 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Contact Phone Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                  required
                />
                <p className="text-xs text-slate-600 font-medium mt-1">10-digit Indian mobile number for technician contacts.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                >
                  <option value="">Select Gender...</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div>
            <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2 border-b border-ice/80 pb-2">
              <GraduationCap className="w-4 h-4 text-[#20543F]" />
              <span>Academic Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">University Enrollment Number</label>
                <input
                  type="text"
                  disabled
                  value={user?.enrollmentNumber || 'Pending Onboarding'}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium bg-slate-100/70 text-slate-600 cursor-not-allowed uppercase font-mono"
                />
                <p className="text-xs text-slate-600 font-medium mt-1">Official university enrollment key.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">College / Institute</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Branch / Department</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                  >
                    <option value="">Select Year...</option>
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 102"
                    className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Hostel Assignment */}
          <div>
            <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2 border-b border-ice/80 pb-2">
              <Building className="w-4 h-4 text-[#20543F]" />
              <span>Hostel & Room Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Hostel Block</label>
                <select
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                  required
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

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-navy mb-1.5">Hostel Campus Address</label>
                <input
                  type="text"
                  value={hostelAddress}
                  onChange={(e) => setHostelAddress(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-ice/80 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-action flex items-center gap-2 px-6 py-2.5 rounded-control text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
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
