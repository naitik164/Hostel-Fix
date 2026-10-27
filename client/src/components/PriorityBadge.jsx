import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, ArrowDown } from 'lucide-react';

const priorityConfig = {
  Critical: {
    bg: 'bg-red-50 text-red-700 border-red-300',
    icon: ShieldAlert,
    iconColor: 'text-red-600',
    badge: 'ring-1 ring-red-400',
  },
  High: {
    bg: 'bg-orange-50 text-orange-700 border-orange-300',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
  },
  Medium: {
    bg: 'bg-amber-50 text-amber-700 border-amber-300',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
  },
  Low: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ArrowDown,
    iconColor: 'text-blue-500',
  },
};

const PriorityBadge = ({ priority, showIcon = true, size = 'sm' }) => {
  const config = priorityConfig[priority] || priorityConfig.Medium;
  const Icon = config.icon;

  const sizeClasses =
    size === 'lg' ? 'px-3 py-1 text-xs font-semibold' : 'px-2 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-sm ${config.bg} ${
        config.badge || ''
      } ${sizeClasses}`}
    >
      {showIcon && <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />}
      {priority}
    </span>
  );
};

export default PriorityBadge;
