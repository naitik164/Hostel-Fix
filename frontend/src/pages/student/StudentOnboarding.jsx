import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';

const POPULAR_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'CSE (Artificial Intelligence & ML)',
  'CSE (Data Science)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Electrical & Electronics (EEE)',
];

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const GENDERS = ['Male', 'Female', 'Other'];

const StudentOnboarding = () => {
  const { user, completeStudentOnboarding, logout } = useAuth();
  const navigate = useNavigate();

  // Current active step: 1 (Personal), 2 (Academic), 3 (Hostel)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    enrollmentNumber: user?.enrollmentNumber || '',
    gender: user?.gender || '',
    collegeName: user?.collegeName || 'LNCTE',
    branch: user?.branch || '',
    academicYear: user?.academicYear || '',
    rollNumber: user?.rollNumber || '',
    hostelBlock: user?.hostelBlock || '',
    roomNumber: user?.roomNumber || '',
    hostelAddress: user?.hostelAddress || 'LNCTE Campus, Bhopal',
  });

  // Dynamic blocks fetched from MongoDB
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Sync user defaults when user loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: user.email || '',
        phone: prev.phone || user.phone || '',
        enrollmentNumber: prev.enrollmentNumber || user.enrollmentNumber || '',
        gender: prev.gender || user.gender || '',
        collegeName: prev.collegeName || user.collegeName || 'LNCTE',
        branch: prev.branch || user.branch || '',
        academicYear: prev.academicYear || user.academicYear || '',
        rollNumber: prev.rollNumber || user.rollNumber || '',
        hostelBlock: prev.hostelBlock || user.hostelBlock || '',
        roomNumber: prev.roomNumber || user.roomNumber || '',
        hostelAddress: prev.hostelAddress || user.hostelAddress || 'LNCTE Campus, Bhopal',
      }));
    }
  }, [user]);

  // Fetch active hostel blocks from server
  useEffect(() => {
    let isMounted = true;
    const fetchBlocks = async () => {
      try {
        setLoadingBlocks(true);
        const res = await api.get('/student/blocks');
        if (isMounted && res.data && res.data.blocks) {
          setBlocks(res.data.blocks);
          // Auto-select first block if none selected
          if (!formData.hostelBlock && res.data.blocks.length > 0) {
            setFormData((prev) => ({ ...prev, hostelBlock: res.data.blocks[0].name }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch blocks via /student/blocks, falling back to default list:', err);
      } finally {
        if (isMounted) setLoadingBlocks(false);
      }
    };
    fetchBlocks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError('');
  };

  // Validate step 1: Personal
  const validateStep1 = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Full name is required (at least 2 characters).';
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '').trim();
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone) {
      errs.phone = 'Mobile number is mandatory.';
    } else if (!indianPhoneRegex.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit Indian phone number starting with 6-9.';
    }

    if (!formData.enrollmentNumber.trim()) {
      errs.enrollmentNumber = 'Enrollment number is mandatory (e.g., 0103CS211054).';
    }

    if (!formData.gender) {
      errs.gender = 'Please select your gender.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate step 2: Academic
  const validateStep2 = () => {
    const errs = {};
    if (!formData.collegeName.trim()) {
      errs.collegeName = 'College name is required.';
    }
    if (!formData.branch.trim()) {
      errs.branch = 'Branch or department is required.';
    }
    if (!formData.academicYear) {
      errs.academicYear = 'Select your current academic year.';
    }
    if (!formData.rollNumber.trim()) {
      errs.rollNumber = 'College roll number is mandatory.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate step 3: Hostel
  const validateStep3 = () => {
    const errs = {};
    if (!formData.hostelBlock.trim()) {
      errs.hostelBlock = 'Please select your assigned hostel block.';
    }
    if (!formData.roomNumber.trim()) {
      errs.roomNumber = 'Room number is mandatory (e.g., A-304).';
    }
    if (!formData.hostelAddress.trim()) {
      errs.hostelAddress = 'Hostel campus address is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setGeneralError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    try {
      setSubmitting(true);
      setGeneralError('');

      const cleanPhone = formData.phone.replace(/[\s-]/g, '').trim();
      const payload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        enrollmentNumber: formData.enrollmentNumber.trim().toUpperCase(),
        gender: formData.gender,
        collegeName: formData.collegeName.trim() || 'LNCTE',
        branch: formData.branch.trim(),
        academicYear: formData.academicYear,
        rollNumber: formData.rollNumber.trim(),
        hostelBlock: formData.hostelBlock.trim(),
        roomNumber: formData.roomNumber.trim(),
        hostelAddress: formData.hostelAddress.trim() || 'LNCTE Campus, Bhopal',
      };

      await completeStudentOnboarding(payload);

      // Successfully saved and verified in MongoDB! Redirect to dashboard
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Failed to complete profile onboarding.';
      setGeneralError(serverMessage);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        // Switch to the step containing the error
        if (err.response.data.errors.enrollmentNumber || err.response.data.errors.phone || err.response.data.errors.name || err.response.data.errors.gender) {
          setCurrentStep(1);
        } else if (err.response.data.errors.branch || err.response.data.errors.academicYear || err.response.data.errors.rollNumber) {
          setCurrentStep(2);
        } else if (err.response.data.errors.hostelBlock || err.response.data.errors.roomNumber) {
          setCurrentStep(3);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-3 sm:p-6 lg:p-8 bg-gradient-dark font-sans overflow-x-hidden">
      {/* Background ambient liquid lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-royal/35 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-electric/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-sky/20 rounded-full filter blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md p-1.5 flex items-center justify-center shadow-md border border-white/60">
            <img
              src="/logo-icon-64.webp"
              srcSet="/logo-icon-64.webp 64w, /logo-icon-128.webp 128w"
              sizes="32px"
              alt="HostelFix"
              width="32"
              height="32"
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg text-white tracking-tight drop-shadow-sm">
              Hostel<span className="text-[#C3DC9B]">Fix</span>
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider">
              Onboarding
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[160px]">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            title="Sign out of this Google Account"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Glass Card Form Container */}
      <main className="relative z-10 w-full max-w-2xl mx-auto my-auto py-2">
        <div className="glass-card p-5 sm:p-8 lg:p-10 shadow-glass-dark border border-white/80 relative overflow-hidden">
          {/* Top Decorative Header Accent */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9EDDA] border border-[#A8B99A]/40 text-[#20543F] text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#00A878] animate-spin-slow" />
              <span>Mandatory Profile Registration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading tracking-tight">
              Welcome to HostelFix!
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              Let's set up your verified student profile before accessing hostel maintenance, grievance tracking, and smart room services.
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="mb-8">
            <div className="grid grid-cols-3 relative">
              {/* Connecting progress lines */}
              <div className="absolute top-4 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-0">
                <div
                  className="h-full bg-gradient-action transition-all duration-500 ease-out"
                  style={{
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                  }}
                />
              </div>

              {/* Step 1 Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(1);
                }}
                className="flex flex-col items-center group relative z-10 cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    currentStep > 1
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                      : currentStep === 1
                      ? 'bg-gradient-action text-white shadow-lg ring-4 ring-sky/30 scale-105'
                      : 'bg-white border-2 border-slate-300 text-slate-700'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <span
                  className={`mt-2 text-xs font-bold tracking-tight transition-colors ${
                    currentStep === 1 ? 'text-[#20543F]' : currentStep > 1 ? 'text-slate-700' : 'text-slate-600'
                  }`}
                >
                  Personal
                </span>
              </button>

              {/* Step 2 Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && validateStep1()) setCurrentStep(2);
                  if (currentStep === 3) setCurrentStep(2);
                }}
                className="flex flex-col items-center group relative z-10 cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    currentStep > 2
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                      : currentStep === 2
                      ? 'bg-gradient-action text-white shadow-lg ring-4 ring-[#A8B99A]/30 scale-105'
                      : 'bg-white border-2 border-slate-300 text-slate-700'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
                <span
                  className={`mt-2 text-xs font-bold tracking-tight transition-colors ${
                    currentStep === 2 ? 'text-[#20543F]' : currentStep > 2 ? 'text-slate-700' : 'text-slate-600'
                  }`}
                >
                  Academic
                </span>
              </button>

              {/* Step 3 Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && validateStep1() && validateStep2()) setCurrentStep(3);
                  if (currentStep === 2 && validateStep2()) setCurrentStep(3);
                }}
                className="flex flex-col items-center group relative z-10 cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    currentStep === 3
                      ? 'bg-gradient-action text-white shadow-lg ring-4 ring-[#A8B99A]/30 scale-105'
                      : 'bg-white border-2 border-slate-300 text-slate-700'
                  }`}
                >
                  3
                </div>
                <span
                  className={`mt-2 text-xs font-bold tracking-tight transition-colors ${
                    currentStep === 3 ? 'text-[#20543F]' : 'text-slate-600'
                  }`}
                >
                  Hostel
                </span>
              </button>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-6 p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{generalError}</div>
            </div>
          )}

          {/* FORM CONTAINER */}
          <form onSubmit={currentStep === 3 ? handleSubmit : handleNextStep}>
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-ice/80 pb-2 mb-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                    <User className="w-4 h-4 text-[#20543F]" />
                    <span>Personal Information</span>
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Your institutional identity verified via Google authentication.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                        errors.name ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    />
                  </div>
                  {errors.name ? (
                    <p className="text-xs text-rose-700 font-medium mt-1">{errors.name}</p>
                  ) : (
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Pre-filled from your Google account. You may correct your legal name.</p>
                  )}
                </div>

                {/* Email (Read-Only) */}
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Official Student Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={formData.email}
                      className="glass-input w-full px-3.5 py-2.5 text-xs font-medium bg-slate-100/80 text-slate-700 cursor-not-allowed select-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      <span>Google Verified</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">Anchored to your verified Google single sign-on profile.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-600 select-none">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={`glass-input w-full pl-12 pr-3.5 py-2.5 text-xs font-medium ${
                          errors.phone ? 'border-rose-400 focus:border-rose-500' : ''
                        }`}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-xs text-rose-700 font-medium mt-1">{errors.phone}</p>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium mt-0.5">10-digit number for SMS alerts and technician calls.</p>
                    )}
                  </div>

                  {/* Enrollment Number */}
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Enrollment Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0103CS211054"
                      value={formData.enrollmentNumber}
                      onChange={(e) => handleChange('enrollmentNumber', e.target.value.toUpperCase())}
                      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium uppercase ${
                        errors.enrollmentNumber ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    />
                    {errors.enrollmentNumber ? (
                      <p className="text-xs text-rose-700 font-medium mt-1">{errors.enrollmentNumber}</p>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Official university roll or registration number.</p>
                    )}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {GENDERS.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => handleChange('gender', g)}
                        className={`py-2 px-3 rounded-control text-xs font-semibold border transition-all text-center ${
                          formData.gender === g
                            ? 'bg-[#20543F] text-white border-[#20543F] shadow-sm'
                            : 'bg-white/70 hover:bg-white text-slate-700 border-[#E9EDDA] hover:border-[#A8B99A]/40'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="text-xs text-rose-700 font-medium mt-1">{errors.gender}</p>
                  )}
                </div>

                {/* Next Step Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="btn-action flex items-center gap-2 px-6 py-2.5 rounded-control text-xs font-bold shadow-md cursor-pointer"
                  >
                    <span>Continue to Academic Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC INFORMATION */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-ice/80 pb-2 mb-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#20543F]" />
                    <span>Academic Information</span>
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Details regarding your institutional curriculum and academic standing.
                  </p>
                </div>

                {/* College Name */}
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    College / Institute Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LNCTE, Bhopal"
                    value={formData.collegeName}
                    onChange={(e) => handleChange('collegeName', e.target.value)}
                    className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                      errors.collegeName ? 'border-rose-400 focus:border-rose-500' : ''
                    }`}
                  />
                  {errors.collegeName ? (
                    <p className="text-xs text-rose-700 font-medium mt-1">{errors.collegeName}</p>
                  ) : (
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Default set to LNCTE. Edit if enrolled in a sister campus.</p>
                  )}
                </div>

                {/* Branch / Department */}
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Branch / Department <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="branches-list"
                    placeholder="e.g. Computer Science & Engineering (CSE)"
                    value={formData.branch}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                      errors.branch ? 'border-rose-400 focus:border-rose-500' : ''
                    }`}
                  />
                  <datalist id="branches-list">
                    {POPULAR_BRANCHES.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                  {errors.branch ? (
                    <p className="text-xs text-rose-700 font-medium mt-1">{errors.branch}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-xs text-slate-600 font-medium self-center">Quick tags:</span>
                      {['CSE', 'IT', 'AI & ML', 'ECE', 'Mechanical'].map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => handleChange('branch', tag)}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E9EDDA] hover:bg-[#E9EDDA]/80 text-[#20543F] transition-colors border border-[#A8B99A]/30"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Current Academic Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.academicYear}
                      onChange={(e) => handleChange('academicYear', e.target.value)}
                      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                        errors.academicYear ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    >
                      <option value="">Select Academic Year...</option>
                      {ACADEMIC_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    {errors.academicYear && (
                      <p className="text-xs text-rose-700 font-medium mt-1">{errors.academicYear}</p>
                    )}
                  </div>

                  {/* College Roll Number */}
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      College Roll Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 102 or CS-21-45"
                      value={formData.rollNumber}
                      onChange={(e) => handleChange('rollNumber', e.target.value)}
                      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                        errors.rollNumber ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    />
                    {errors.rollNumber ? (
                      <p className="text-xs text-rose-700 font-medium mt-1">{errors.rollNumber}</p>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Class / Section roll number.</p>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-control text-xs font-semibold text-slate-700 hover:text-navy hover:bg-ice transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="btn-action flex items-center gap-2 px-6 py-2.5 rounded-control text-xs font-bold shadow-md cursor-pointer"
                  >
                    <span>Continue to Hostel Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: HOSTEL INFORMATION */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-ice/80 pb-2 mb-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#20543F]" />
                    <span>Hostel & Room Assignment</span>
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Required to route room maintenance requests directly to your hostel block's technicians.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hostel Block Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Hostel Block <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.hostelBlock}
                      onChange={(e) => handleChange('hostelBlock', e.target.value)}
                      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                        errors.hostelBlock ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    >
                      <option value="">Select Hostel Block...</option>
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
                    {errors.hostelBlock ? (
                      <p className="text-xs text-rose-700 font-medium mt-1">{errors.hostelBlock}</p>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Allocated residential hostel block.</p>
                    )}
                  </div>

                  {/* Room Number */}
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Room Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A-304 or D-101"
                      value={formData.roomNumber}
                      onChange={(e) => handleChange('roomNumber', e.target.value)}
                      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                        errors.roomNumber ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    />
                    {errors.roomNumber ? (
                      <p className="text-xs text-rose-700 font-medium mt-1">{errors.roomNumber}</p>
                    ) : (
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Your official room identifier.</p>
                    )}
                  </div>
                </div>

                {/* Hostel Address / Campus */}
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Hostel Campus Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LNCTE Campus, Bhopal"
                    value={formData.hostelAddress}
                    onChange={(e) => handleChange('hostelAddress', e.target.value)}
                    className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium ${
                      errors.hostelAddress ? 'border-rose-400 focus:border-rose-500' : ''
                    }`}
                  />
                  {errors.hostelAddress && (
                    <p className="text-xs text-rose-700 font-medium mt-1">{errors.hostelAddress}</p>
                  )}
                </div>

                {/* Privacy & Verification Note */}
                <div className="p-3.5 rounded-control bg-[#F7F8F0] border border-[#A8B99A]/40 text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-[#20543F] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00A878] shrink-0" />
                    <span>Hostel Administration Data Guarantee</span>
                  </p>
                  <p className="leading-relaxed">
                    By submitting this profile, you confirm that your hostel block and room allocation are accurate. This information is saved to your account in MongoDB Atlas and used exclusively for hostel issue tracking, warden verification, and emergency notices.
                  </p>
                </div>

                {/* Final Navigation & Submit Buttons */}
                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-control text-xs font-semibold text-slate-600 hover:text-navy hover:bg-ice transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-action flex items-center gap-2 px-7 py-3 rounded-control text-xs font-bold shadow-lg shadow-royal/20 cursor-pointer disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Profile to Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Profile & Open Dashboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 text-xs text-white/60">
        &copy; {new Date().getFullYear()} HostelFix. Smart Hostel Complaint & Maintenance Management System.
      </footer>
    </div>
  );
};

export default StudentOnboarding;

