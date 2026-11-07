import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import {
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';

const AdminBlocks = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [totalRooms, setTotalRooms] = useState(60);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/blocks');
      if (res.data && res.data.success) {
        setBlocks(res.data.blocks || []);
      }
    } catch (err) {
      console.error('Failed to load blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  // Lock background page scroll when modal is open and restore on close
  useEffect(() => {
    if (!modalOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen]);

  const openAddModal = () => {
    setEditingBlock(null);
    setName('');
    setCode('');
    setDescription('');
    setTotalRooms(60);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (block) => {
    setEditingBlock(block);
    setName(block.name);
    setCode(block.code);
    setDescription(block.description || '');
    setTotalRooms(block.totalRooms || 60);
    setError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setError('');
      if (editingBlock) {
        await api.patch(`/admin/blocks/${editingBlock._id}`, {
          name,
          description,
          totalRooms: Number(totalRooms),
        });
      } else {
        await api.post('/admin/blocks', {
          name,
          code,
          description,
          totalRooms: Number(totalRooms),
        });
      }
      setModalOpen(false);
      fetchBlocks();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleStatus = async (block) => {
    try {
      await api.patch(`/admin/blocks/${block._id}`, {
        isActive: !block.isActive,
      });
      fetchBlocks();
    } catch (err) {
      alert('Error updating block status: ' + err.message);
    }
  };

  const handleDelete = async (block) => {
    if (!window.confirm(`Are you sure you want to delete "${block.name}"?`)) return;
    try {
      await api.delete(`/admin/blocks/${block._id}`);
      fetchBlocks();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete block.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-2">
            <span>Hostel Blocks</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-ice text-royal border border-sky/40">
              {blocks.length} buildings
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure residential hostels, room capacities, and track aggregated maintenance density
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-action inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Hostel Block</span>
        </button>
      </div>

      {/* Blocks Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-electric" />
          <p className="text-xs">Fetching hostel block registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map((block) => (
            <div
              key={block._id}
              className={`glass-card p-6 flex flex-col justify-between transition-all ${
                !block.isActive ? 'opacity-60 bg-slate-100/50' : 'hover:shadow-glass-hover'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-action text-white flex items-center justify-center shadow-md">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy text-base">{block.name}</h3>
                      <p className="font-mono text-xs text-royal font-semibold">{block.code}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      block.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                  >
                    {block.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  {block.description || 'No description provided.'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/60 p-2.5 rounded-xl border border-sky/20">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Capacity
                    </span>
                    <span className="font-bold text-navy">{block.totalRooms} Rooms</span>
                  </div>

                  <div className="bg-white/60 p-2.5 rounded-xl border border-sky/20">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                      Total Tickets
                    </span>
                    <span className="font-bold text-royal">
                      {block.complaintsCount || 0} Complaints
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-ice/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(block)}
                  className="btn-secondary flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => toggleStatus(block)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    block.isActive
                      ? 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {block.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleDelete(block)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                  title="Delete Block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Add / Edit Modal Rendered via React Portal --- */}
      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="staff-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setModalOpen(false);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-modal-title"
          >
            <div
              className="staff-modal glass-modal p-5 sm:p-8 space-y-4 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-ice/80 pb-3">
                <h3 id="block-modal-title" className="font-heading font-bold text-base text-navy">
                  {editingBlock ? 'Edit Hostel Block' : 'Register New Hostel Block'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors touch-target cursor-pointer"
                  aria-label="Close dialog"
                >
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
                  <label className="block text-xs font-semibold text-navy mb-1.5">Block Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aryabhata Block"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-medium"
                  />
                </div>

                {!editingBlock && (
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1.5">Block Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Block A"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="glass-input w-full p-2.5 text-xs font-medium uppercase"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Total Rooms</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={totalRooms}
                    onChange={(e) => setTotalRooms(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Undergraduate Engineering Hall (Floors 1-4)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-ice/80 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="btn-action px-5 py-2 text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {modalLoading ? 'Saving...' : editingBlock ? 'Save Changes' : 'Create Block'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminBlocks;
