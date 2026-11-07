import React from 'react';
import {
  Utensils,
  Droplets,
  Zap,
  Wrench,
  Wifi,
  ShieldCheck,
  Check,
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
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 auto-rows-fr w-full ${className}`}
      role="radiogroup"
      aria-label="Complaint Categories"
    >
      {CATEGORIES_DATA.map((cat, idx) => {
        const Icon = cat.icon;
        const isSelected =
          Boolean(selectedCategory) &&
          (selectedCategory === cat.name ||
            selectedCategory === cat.backendValue ||
            (cat.id === 'plumbing' && selectedCategory.startsWith('Plumbing')) ||
            (cat.id === 'electrical' && selectedCategory.includes('Electri')) ||
            (cat.id === 'security' &&
              (selectedCategory.includes('Security') || selectedCategory.includes('Safety'))));

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
              animationDelay: `${idx * 80}ms`,
              animationFillMode: 'both',
            }}
            className={`
              group relative w-full h-full min-h-[82px] sm:min-h-[96px]
              p-3 sm:px-5 sm:py-4.5
              flex items-center text-left select-none
              rounded-[20px] sm:rounded-[22px]
              transition-all duration-200 ease-out
              animate-in fade-in slide-in-from-bottom-2 duration-400
              ${interactive ? 'cursor-pointer' : 'cursor-default'}
              border-2
              ${
                isSelected
                  ? 'border-[#1951FC] bg-gradient-to-r from-blue-50/95 via-white to-[#E1F1FD]/90 shadow-[0_12px_28px_-4px_rgba(25,81,252,0.2),inset_0_1px_0_0_rgba(255,255,255,0.95)]'
                  : 'border-white/80 bg-gradient-to-r from-white/95 via-white/85 to-[#EBF5FE]/75 shadow-[0_8px_24px_-6px_rgba(3,25,91,0.06),0_2px_8px_-2px_rgba(25,81,252,0.04),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:border-[#77C1FC] hover:bg-gradient-to-r hover:from-white hover:via-[#F0F7FF] hover:to-[#E1F1FD] hover:shadow-[0_14px_32px_-6px_rgba(25,81,252,0.14),0_4px_12px_-2px_rgba(3,25,91,0.06),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:-translate-y-1'
              }
              backdrop-blur-xl
            `}
          >
            {/* Top-right subtle selection indicator (does not affect flex flow or shift layout) */}
            {isSelected && (
              <div
                aria-hidden="true"
                className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 rounded-full bg-[#1951FC] text-white flex items-center justify-center shadow-sm animate-in fade-in zoom-in-75 duration-200"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4.5 w-full min-w-0">
              {/* Responsive icon container (46px on small mobile, 56px on sm+) */}
              <div
                className={`
                  w-11.5 h-11.5 min-w-[46px] min-h-[46px] sm:w-14 sm:h-14 sm:min-w-[56px] sm:min-h-[56px] shrink-0
                  rounded-[14px] sm:rounded-[16px] flex items-center justify-center
                  transition-all duration-200 ease-out
                  ${
                    isSelected
                      ? 'bg-[#1951FC] text-white shadow-md shadow-electric/25'
                      : 'bg-[#CBE9FD]/70 text-[#1951FC] border border-[#77C1FC]/60 group-hover:bg-[#CBE9FD] group-hover:scale-105 group-hover:border-[#1951FC]/40'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-[#1951FC]'
                  }`}
                />
              </div>

              {/* Vertically centered category title */}
              <div className="flex-1 min-w-0 flex items-center">
                <h3
                  className={`
                    font-heading font-bold text-[15px] sm:text-[18px] lg:text-[19px] tracking-tight leading-snug
                    transition-colors duration-200 break-words
                    ${isSelected ? 'text-[#0B2CB1]' : 'text-[#03195B] group-hover:text-[#0B2CB1]'}
                  `}
                >
                  {cat.name}
                </h3>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CategorySelector;
