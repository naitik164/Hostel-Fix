import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CategorySelector from '../../components/CategorySelector';
import {
  PlusCircle,
  ArrowLeft,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES_MAP = {
  'Food Quality & Mess': [
    'Hygiene & Cleanliness',
    'Under-cooked / Raw Food',
    'Foreign Object / Insects',
    'Special Diet / Medical Mess',
    'Dining Utensils / Seating',
    'Mess Staff Conduct',
  ],
  'Drinking Water': [
    'Water Cooler Outage',
    'Sediment / Bad Taste',
    'RO Filter Replacement',
    'Water Temperature',
    'Dispenser Tap Leak',
  ],
  'Plumbing & Washroom': [
    'Ceiling Leakage',
    'Clogged Toilet / Drain',
    'Geyser / Hot Water Outage',
    'Broken Tap / Showerhead',
    'Mirror / Washbasin Crack',
    'Washroom Door Lock',
  ],
  'Electricity & Lighting': [
    'Switchboard / Wiring Sparks',
    'Ceiling Fan Repair',
    'Room / Corridor Tube Light',
    'Power Socket Malfunction',
    'Frequent Circuit Breaker Trip',
  ],
  'Cleanliness & Hygiene': [
    'Room Deep Cleaning',
    'Corridor Sweeping & Mopping',
    'Waste Management / Garbage Bins',
    'Sanitary Napkin Incinerator',
    'Foul Odor / Pest Smells',
  ],
  'Room Maintenance': [
    'Door / Window Latch Broken',
    'Glass Window Pane Cracked',
    'Balcony Drain Blockage',
    'Wall Paint / Damp Seepage',
    'Curtain Rods / Hooks',
  ],
  'Furniture & Fixtures': [
    'Study Table Fractured',
    'Study Chair Broken',
    'Bed Frame / Spring Damage',
    'Cupboard / Wardrobe Lock',
    'Mattress Condition',
  ],
  'Internet & Wi-Fi': [
    'Wi-Fi Access Point Offline',
    'Frequent Packet Drop / High Latency',
    'LAN Socket Damaged',
    'Captive Portal Login Failure',
  ],
  'Security & Safety': [
    'Biometric Turnstile Failure',
    'Hostel Gate Security',
    'Fire Extinguisher Inspection',
    'Suspicious Activity / Intruders',
    'Theft / Property Damage',
  ],
  'Pest Control': [
    'Cockroach Infestation',
    'Termite Dust / Damage',
    'Bed Bugs',
    'Mosquito Fogging Required',
    'Rodent / Pigeon Nuisance',
  ],
  'Common Area Maintenance': [
    'Gym Equipment Malfunction',
    'TV / Recreation Room',
    'Reading Room Lighting / AC',
    'Elevator / Lift Service',
    'Cycle Parking Shed',
  ],
  Other: ['General Complaint', 'Administrative Inquiry', 'Noise Disturbance'],
};

const NewComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing & Washroom');
  const [subcategory, setSubcategory] = useState('Ceiling Leakage');
  const [description, setDescription] = useState('');
  const [hostelBlockName, setHostelBlockName] = useState(user?.hostelBlock || 'Block A');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [location, setLocation] = useState('');
  const [preferredContact, setPreferredContact] = useState('Email');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/student/dashboard');
        if (res.data && res.data.blocks) {
          setBlocks(res.data.blocks);
        }
      } catch (err) {
        console.error('Failed to load blocks:', err);
      }
    };
    fetchBlocks();
  }, []);

  // Update subcategories when category changes
  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setCategory(newCat);
    const subList = CATEGORIES_MAP[newCat] || [];
    setSubcategory(subList[0] || '');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 4) {
      setError('You can upload a maximum of 4 photos.');
      return;
    }

    // Validate size and mime type
    for (const f of selectedFiles) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 5MB size limit.`);
        return;
      }
      if (!f.type.startsWith('image/')) {
        setError(`File "${f.name}" is not an image.`);
        return;
      }
    }

    setError('');
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    // Generate previews
    const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !category || !description.trim() || !hostelBlockName.trim()) {
      setError('Please fill all mandatory fields (Title, Category, Description, and Hostel Block).');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('subcategory', subcategory);
      formData.append('description', description.trim());
      formData.append('hostelBlockName', hostelBlockName);
      formData.append('roomNumber', roomNumber.trim());
      formData.append('location', location.trim());
      formData.append('preferredContact', preferredContact);

      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/student/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (res.data && res.data.success) {
        navigate(`/student/complaints/${res.data.complaint._id}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to submit complaint. Please try again.'
      );
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <Link
        to="/student/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-royal hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="glass-card p-4 sm:p-8 lg:p-10 shadow-glass-hover">
        {/* Header */}
        <div className="border-b border-ice/80 pb-5 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-action flex items-center justify-center text-white shadow-md shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy font-heading">
              Raise a Complaint
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Submit a maintenance or facilities request. Your complaint will be assigned a concurrency-safe
            reference ID and dispatched to the hostel warden.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-navy">
                Complaint Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{title.length} / 120</span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Water leaking heavily from ceiling joint in washroom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
            />
          </div>

          {/* Category Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-navy">
                Select Complaint Category <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Click a card below to select primary category
              </span>
            </div>

            <CategorySelector
              selectedCategory={category}
              onSelectCategory={(name, backendVal) => {
                const target = CATEGORIES_MAP[name] ? name : (CATEGORIES_MAP[backendVal] ? backendVal : name);
                setCategory(target);
                const subList = CATEGORIES_MAP[target] || [];
                setSubcategory(subList[0] || '');
              }}
            />

            {/* Subcategory & Category Override Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Category Area (All 12 Categories)
                </label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                >
                  {Object.keys(CATEGORIES_MAP).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Subcategory <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
                >
                  {(CATEGORIES_MAP[category] || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-navy">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{description.length} / 2000</span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={2000}
              placeholder="Provide specific details about the issue, when it started, and safety concerns..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full p-3.5 text-xs font-medium leading-relaxed"
            />
          </div>

          {/* Hostel Block, Room Number & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Hostel Block <span className="text-rose-500">*</span>
              </label>
              <select
                value={hostelBlockName}
                onChange={(e) => setHostelBlockName(e.target.value)}
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
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Room Number
              </label>
              <input
                type="text"
                placeholder="e.g. A-304"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                Exact Location / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. 3rd Floor East Washroom"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-xs font-medium"
              />
            </div>
          </div>

          {/* Photo Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">
              Attach Photos (Optional - Max 4 images, 5MB each)
            </label>
            <div className="border-2 border-dashed border-sky/50 rounded-2xl p-6 text-center bg-white/40 hover:bg-white/60 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                disabled={files.length >= 4}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <UploadCloud className="w-10 h-10 text-royal mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-navy">
                Click or drag & drop complaint photos here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG, WEBP up to 5MB</p>
            </div>

            {/* Photo Previews */}
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {previews.map((src, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-sky/40 aspect-video bg-slate-100">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label="Remove photo"
                      className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-black text-white rounded-full p-1.5 transition-opacity opacity-90 sm:opacity-0 group-hover:opacity-100 touch-target flex items-center justify-center w-7 h-7"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Contact Method */}
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">
              Preferred Contact Method
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-medium text-slate-700">
              {['Email', 'Phone', 'In-Person'].map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer p-1">
                  <input
                    type="radio"
                    name="contact"
                    value={method}
                    checked={preferredContact === method}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    className="text-royal focus:ring-electric"
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {submitting && files.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-sky/10 border border-sky/30">
              <div className="flex items-center justify-between text-[11px] font-bold text-royal">
                <span>Uploading {files.length} Photo{files.length > 1 ? 's' : ''} to Secure Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-royal via-electric to-sky rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submission Bar */}
          <div className="pt-6 border-t border-ice/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              🔒 Severity priority is dynamically suggested using automated safety guidelines.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="btn-action w-full sm:w-auto px-8 py-3 rounded-control text-xs font-bold shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Complaint...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;
