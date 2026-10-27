import React from 'react';

const statusConfig = {
  Submitted: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
  },
  Assigned: {
    bg: 'bg-sky-50 text-sky-700 border-sky-300',
    dot: 'bg-sky-500',
  },
  'In Progress': {
    bg: 'bg-amber-50 text-amber-700 border-amber-300',
    dot: 'bg-amber-500 animate-pulse',
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Rejected: {
    bg: 'bg-rose-50 text-rose-700 border-rose-300',
    dot: 'bg-rose-500',
  },
};

const StatusBadge = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
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
