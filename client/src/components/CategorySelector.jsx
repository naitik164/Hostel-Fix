import React from 'react';
import {
  Utensils,
  Droplets,
  Zap,
  Wrench,
  Wifi,
  ShieldCheck,
} from 'lucide-react';

export const CATEGORIES_DATA = [
  {
    id: 'food',
    name: 'Food Quality & Mess',
    backendValue: 'Food Quality & Mess',
    icon: Utensils,
  },
  {
    id: 'water',
    name: 'Drinking Water',
    backendValue: 'Drinking Water',
    icon: Droplets,
  },
  {
    id: 'electrical',
    name: 'Electrical & Lighting',
    backendValue: 'Electricity & Lighting', // Maps cleanly to backend model when used in forms
    icon: Zap,
  },
  {
    id: 'plumbing',
    name: 'Plumbing & Washrooms',
    backendValue: 'Plumbing & Washroom', // Maps cleanly to backend model when used in forms
    icon: Wrench,
  },
  {
    id: 'internet',
    name: 'Internet & Wi-Fi',
    backendValue: 'Internet & Wi-Fi',
    icon: Wifi,
  },
  {
    id: 'security',
    name: 'Safety & Security',
    backendValue: 'Security & Safety', // Maps cleanly to backend model when used in forms
    icon: ShieldCheck,
  },
];

const CategorySelector = ({
  selectedCategory,
  onSelectCategory,
  interactive = true,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full ${className}`}
      role="radiogroup"
      aria-label="Complaint Categories"
    >
      {CATEGORIES_DATA.map((cat, idx) => {
        const Icon = cat.icon;
        const isSelected =
          selectedCategory === cat.name ||
          selectedCategory === cat.backendValue;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(cat.name, cat.backendValue)}
            disabled={!interactive}
            role="radio"
            aria-checked={isSelected}
            tabIndex={interactive ? 0 : -1}
            style={{
              animationDelay: `${idx * 110}ms`,
              animationFillMode: 'both',
            }}
            className={`
              group relative w-full min-h-[96px] sm:h-[104px] px-5 sm:px-7 py-4 sm:py-0
              flex items-center justify-center gap-4 sm:gap-5
              rounded-[24px] text-left select-none
              transition-all duration-300 ease-out
              animate-in fade-in slide-in-from-bottom-3 duration-500
              ${interactive ? 'cursor-pointer' : 'cursor-default'}
              bg-gradient-to-r from-white/95 via-white/85 to-[#EBF5FE]/75
              backdrop-blur-xl
              border border-white/90
              shadow-[0_8px_24px_-6px_rgba(3,25,91,0.06),0_2px_8px_-2px_rgba(25,81,252,0.04),inset_0_1px_0_0_rgba(255,255,255,0.95)]
              hover:border-[#77C1FC]
              hover:bg-gradient-to-r hover:from-white hover:via-[#F0F7FF] hover:to-[#E1F1FD]
              hover:shadow-[0_16px_36px_-6px_rgba(25,81,252,0.16),0_4px_14px_-2px_rgba(3,25,91,0.08),inset_0_1px_0_0_rgba(255,255,255,0.95)]
              hover:-translate-y-1.5
            `}
          >
            {/* 56px square icon container */}
            <div
              className="w-14 h-14 shrink-0 rounded-[16px] flex items-center justify-center bg-[#CBE9FD]/70 text-[#1951FC] border border-[#77C1FC]/60 transition-all duration-300 ease-out group-hover:bg-[#CBE9FD] group-hover:scale-105 group-hover:border-[#1951FC]/40"
            >
              <Icon className="w-6 h-6 stroke-[2.2] text-[#1951FC]" />
            </div>

            {/* Category Title typography */}
            <h3 className="font-heading font-bold text-[18px] sm:text-[20px] tracking-tight text-[#03195B] group-hover:text-[#0B2CB1] transition-colors duration-200 whitespace-normal sm:whitespace-nowrap">
              {cat.name}
            </h3>
          </button>
        );
      })}
    </div>
  );
};

export default CategorySelector;
