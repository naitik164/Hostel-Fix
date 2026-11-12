import React from 'react';

const statusConfig = {
  Submitted: {
    bg: 'bg-[#A8B99A]/20 text-[#173D30] border-[#A8B99A]/40',
    dot: 'bg-[#20543F]',
  },
  'Under Review': {
    bg: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-amber-600',
  },
  Assigned: {
    bg: 'bg-[#20543F]/15 text-[#20543F] border-[#20543F]/30',
    dot: 'bg-[#20543F]',
  },
  'In Progress': {
    bg: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-amber-600 animate-pulse',
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dot: 'bg-[#00A878]',
  },
  Rejected: {
    bg: 'bg-rose-50 text-rose-900 border-rose-300',
    dot: 'bg-rose-600',
  },
};

const StatusBadge = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    dot: 'bg-slate-500',
  };

  const sizeClasses =
    size === 'lg' ? 'px-3.5 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
