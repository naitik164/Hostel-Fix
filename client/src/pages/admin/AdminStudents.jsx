import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building,
  Mail,
  Phone,
  Loader2,
  FileText,
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        block: selectedBlock !== 'all' ? selectedBlock : undefined,
      };
      const [studentsRes, blocksRes] = await Promise.all([
        api.get('/admin/students', { params }),
        api.get('/admin/blocks'),
      ]);
      if (studentsRes.data && studentsRes.data.success) {
        setStudents(studentsRes.data.students || []);
      }
      if (blocksRes.data && blocksRes.data.blocks) {
        setBlocks(blocksRes.data.blocks);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedBlock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const toggleStatus = async (student) => {
    try {
      await api.patch(`/admin/students/${student._id}/status`);
      fetchStudents();
    } catch (err) {
      alert('Error updating student status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-2">
            <span>Student Resident Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-ice text-royal border border-sky/40">
              {students.length} students
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified Google accounts, room assignments, and individual complaint engagement
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, email, or room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-9 pr-3 py-2 text-xs w-full"
            />
          </div>

          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="glass-input px-3 py-2 text-xs w-full sm:w-auto"
          >
            <option value="all">All Hostel Blocks</option>
            {blocks.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="btn-action px-4 py-2 rounded-control text-xs font-semibold justify-center w-full sm:w-auto"
          >
            Search
          </button>
        </form>
      </div>

      {/* Directory Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-electric" />
            <p className="text-xs">Loading registered resident directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center p-6 text-slate-500">
            No student residents found matching search query.
          </div>
        ) : (
          <div className="table-responsive-container">
            <div className="sm:hidden px-4 py-2 bg-ice/40 border-b border-ice text-[11px] text-royal flex items-center justify-between font-medium">
              <span>Swipe horizontally to view full resident data</span>
              <span>👉</span>
            </div>
            <div className="overflow-x-auto">
              <table className="glass-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Hostel Block</th>
                    <th>Room Number</th>
                    <th>Contact Info</th>
                    <th>Complaints Raised</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                {students.map((student) => (
                  <tr key={student._id} className="transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={student.profilePhoto}
                          name={student.name}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-navy text-xs">{student.name}</div>
                          <div className="text-[11px] text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">
                      {student.hostelBlock || <span className="italic text-slate-400">Not set</span>}
                    </td>
                    <td className="text-xs font-mono text-royal font-semibold">
                      {student.roomNumber || <span className="italic text-slate-400 font-sans">N/A</span>}
                    </td>
                    <td className="text-xs text-slate-500">
                      {student.phone || <span className="italic text-slate-400">No phone</span>}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-ice text-royal">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{student.complaintsCount || 0}</span>
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          student.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => toggleStatus(student)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          student.isActive
                            ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {student.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudents;
