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
  selectedCategory, // Kept for backwards compatibility; persistent visual selection is completely removed
  onSelectCategory,
  interactive = true,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 auto-rows-fr w-full ${className}`}
      role="group"
      aria-label="Complaint Categories"
    >
      {CATEGORIES_DATA.map((cat, idx) => {
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(cat.name, cat.backendValue)}
            disabled={!interactive}
            tabIndex={interactive ? 0 : -1}
            style={{
              animationDelay: `${idx * 80}ms`,
              animationFillMode: 'both',
            }}
            className={`
              category-card group relative w-full h-full min-h-[82px] sm:min-h-[96px]
              p-3 sm:px-5 sm:py-4.5
              flex items-center text-left select-none
              rounded-[20px] sm:rounded-[22px]
              animate-in fade-in slide-in-from-bottom-2 duration-400
              ${interactive ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <div className="flex items-center gap-3 sm:gap-4.5 w-full min-w-0">
              {/* Responsive icon container (46px on small mobile, 56px on sm+) with smooth hover scale */}
              <div
                className="category-card-icon
                  w-11.5 h-11.5 min-w-[46px] min-h-[46px] sm:w-14 sm:h-14 sm:min-w-[56px] sm:min-h-[56px] shrink-0
                  rounded-[14px] sm:rounded-[16px] flex items-center justify-center
                  bg-[#CBE9FD]/70 text-[#1951FC] border border-[#77C1FC]/60
                  transition-all duration-300 ease-out
                "
              >
                <Icon
                  className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-[#1951FC] group-hover:text-[#0B2CB1] transition-colors duration-300 ease-out"
                />
              </div>

              {/* Vertically centered category title */}
              <div className="flex-1 min-w-0 flex items-center">
                <h3
                  className="font-heading font-bold text-[15px] sm:text-[18px] lg:text-[19px] tracking-tight leading-snug
                    text-[#03195B] group-hover:text-[#0B2CB1]
                    transition-colors duration-300 ease-out break-words"
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
