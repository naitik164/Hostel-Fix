import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner
 * 
 * Branded liquid-glass circular spinner for buttons, inline states, and cards.
 */
export const LoadingSpinner = ({
  size = 'md',
  className = '',
  label,
  color = 'electric',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const colorMap = {
    electric: 'text-electric',
    white: 'text-white',
    sky: 'text-sky',
    navy: 'text-navy',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 justify-center ${className}`}>
      <Loader2
        className={`${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.electric} animate-spin`}
      />
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
    </div>
  );
};

/**
 * CardSkeleton
 * 
 * Liquid-glass shimmering skeleton for dashboard KPI metric cards.
 */
export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 sm:p-6 overflow-hidden relative">
          <div className="flex items-center justify-between">
            <div className="w-24 h-3.5 rounded-md skeleton-shimmer" />
            <div className="w-9 h-9 rounded-xl skeleton-shimmer" />
          </div>
          <div className="mt-4 w-16 h-8 rounded-lg skeleton-shimmer" />
          <div className="mt-2 w-32 h-3 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
};

/**
 * TableSkeleton
 * 
 * Shimmering skeleton rows for complaint tables, task lists, and directories.
 */
export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-sky/20 flex items-center justify-between">
        <div className="w-40 h-5 rounded-md skeleton-shimmer" />
        <div className="w-24 h-4 rounded-md skeleton-shimmer" />
      </div>
      <div className="divide-y divide-sky/15">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="w-3/4 h-4 rounded skeleton-shimmer" />
                <div className="w-1/2 h-3 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="hidden sm:block w-20 h-5 rounded-full skeleton-shimmer" />
            <div className="w-16 h-5 rounded-full skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * PageTransition
 * 
 * Wrapper providing subtle fade and upward motion (Phase 4 of loading sequence)
 * for smooth, flicker-free page content presentation.
 */
export const PageTransition = ({ children, className = '' }) => {
  return (
    <div className={`flex-1 flex flex-col w-full animate-page-reveal ${className}`}>
      {children}
    </div>
  );
};

export default LoadingSpinner;

