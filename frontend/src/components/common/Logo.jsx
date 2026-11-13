import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Official HostelFix Brand Logo Component
 * Single Source of Truth for all logo implementations across HostelFix.
 * 
 * Supports:
 * - variant="icon"            : Standalone square app icon (responsive WebP with PNG fallback)
 * - variant="horizontal"      : Official horizontal lockup (Icon + HostelFix + Subtitle)
 * - variant="horizontal-clean": Official compact horizontal lockup (Icon + HostelFix wordmark)
 * - variant="full"            : Official stacked brand logo (Icon + Wordmark + Subtitle)
 * - variant="brand"           : Authentic icon + responsive typography with optional subtitle/badge
 */
const Logo = ({
  variant = 'icon',
  size = 'md',
  to,
  className = '',
  iconClassName = '',
  textClassName = '',
  subtitle,
  badge,
  alt = 'HostelFix Logo',
  priority = false,
  onClick,
}) => {
  // Preset pixel dimensions based on variant and size
  const iconSizes = {
    xs: { width: 24, height: 24, class: 'w-6 h-6' },
    sm: { width: 32, height: 32, class: 'w-8 h-8' },
    md: { width: 40, height: 40, class: 'w-10 h-10' },
    lg: { width: 48, height: 48, class: 'w-12 h-12' },
    xl: { width: 64, height: 64, class: 'w-16 h-16' },
    '2xl': { width: 80, height: 80, class: 'w-20 h-20' },
  };

  const horizontalSizes = {
    xs: { height: 24, width: Math.round(24 * 6.18) },
    sm: { height: 32, width: Math.round(32 * 6.18) },
    md: { height: 40, width: Math.round(40 * 6.18) },
    lg: { height: 48, width: Math.round(48 * 6.18) },
    xl: { height: 60, width: Math.round(60 * 6.18) },
  };

  const horizontalCleanSizes = {
    xs: { height: 24, width: Math.round(24 * 6.64) },
    sm: { height: 32, width: Math.round(32 * 6.64) },
    md: { height: 38, width: Math.round(38 * 6.64) },
    lg: { height: 48, width: Math.round(48 * 6.64) },
    xl: { height: 56, width: Math.round(56 * 6.64) },
  };

  const fullSizes = {
    xs: { width: 120, height: Math.round(120 / 1.416) },
    sm: { width: 160, height: Math.round(160 / 1.416) },
    md: { width: 200, height: Math.round(200 / 1.416) },
    lg: { width: 260, height: Math.round(260 / 1.416) },
    xl: { width: 320, height: Math.round(320 / 1.416) },
  };

  // Render standalone icon
  if (variant === 'icon') {
    const dim = typeof size === 'number'
      ? { width: size, height: size, class: `w-[${size}px] h-[${size}px]` }
      : (iconSizes[size] || iconSizes.md);

    const content = (
      <img
        src="/hostelfix-icon.webp"
        srcSet="/hostelfix-icon-32.webp 32w, /hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w, /hostelfix-icon-256.webp 256w, /hostelfix-icon.webp 512w"
        sizes={`${dim.width}px`}
        alt={alt}
        width={dim.width}
        height={dim.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`object-contain filter drop-shadow-sm select-none ${dim.class} ${iconClassName}`}
      />
    );

    if (to) {
      return (
        <Link to={to} className={`inline-flex items-center ${className}`} onClick={onClick}>
          {content}
        </Link>
      );
    }
    return <div className={`inline-flex items-center ${className}`}>{content}</div>;
  }

  // Render official horizontal logo (Icon + Wordmark + Subtitle)
  if (variant === 'horizontal') {
    const dim = typeof size === 'number'
      ? { height: size, width: Math.round(size * 6.18) }
      : (horizontalSizes[size] || horizontalSizes.md);

    const content = (
      <img
        src="/hostelfix-logo-horizontal.webp"
        alt={alt}
        width={dim.width}
        height={dim.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`object-contain h-auto select-none ${iconClassName}`}
        style={{ maxHeight: dim.height, maxWidth: '100%' }}
      />
    );

    if (to) {
      return (
        <Link to={to} className={`inline-flex items-center ${className}`} onClick={onClick}>
          {content}
        </Link>
      );
    }
    return <div className={`inline-flex items-center ${className}`}>{content}</div>;
  }

  // Render official compact horizontal logo (Icon + Wordmark without subtitle)
  if (variant === 'horizontal-clean') {
    const dim = typeof size === 'number'
      ? { height: size, width: Math.round(size * 6.64) }
      : (horizontalCleanSizes[size] || horizontalCleanSizes.md);

    const content = (
      <img
        src="/hostelfix-logo-horizontal-clean.webp"
        alt={alt}
        width={dim.width}
        height={dim.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`object-contain h-auto select-none ${iconClassName}`}
        style={{ maxHeight: dim.height, maxWidth: '100%' }}
      />
    );

    if (to) {
      return (
        <Link to={to} className={`inline-flex items-center ${className}`} onClick={onClick}>
          {content}
        </Link>
      );
    }
    return <div className={`inline-flex items-center ${className}`}>{content}</div>;
  }

  // Render official stacked full logo (Icon + Wordmark + Subtitle)
  if (variant === 'full') {
    const dim = typeof size === 'number'
      ? { width: size, height: Math.round(size / 1.416) }
      : (fullSizes[size] || fullSizes.md);

    const content = (
      <img
        src="/hostelfix-logo.webp"
        alt={alt}
        width={dim.width}
        height={dim.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`object-contain select-none ${iconClassName}`}
        style={{ width: dim.width, height: 'auto', maxWidth: '100%' }}
      />
    );

    if (to) {
      return (
        <Link to={to} className={`inline-flex items-center ${className}`} onClick={onClick}>
          {content}
        </Link>
      );
    }
    return <div className={`inline-flex items-center ${className}`}>{content}</div>;
  }

  // Render brand lockup (Official Icon + Typography)
  if (variant === 'brand') {
    const dim = typeof size === 'number'
      ? { width: size, height: size, class: `w-[${size}px] h-[${size}px]` }
      : (iconSizes[size] || iconSizes.md);

    const content = (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src="/hostelfix-icon.webp"
          srcSet="/hostelfix-icon-32.webp 32w, /hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w, /hostelfix-icon-256.webp 256w, /hostelfix-icon.webp 512w"
          sizes={`${dim.width}px`}
          alt={alt}
          width={dim.width}
          height={dim.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className={`object-contain filter drop-shadow-sm select-none shrink-0 ${dim.class} ${iconClassName}`}
        />
        <div className={`flex flex-col select-none ${textClassName}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#173D30] font-heading leading-tight">
              Hostel<span className="text-[#00A878]">Fix</span>
            </span>
            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E9EDDA] text-[#20543F] border border-[#A8B99A]/40 uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] uppercase tracking-wider text-[#6A8A64] font-semibold -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );

    if (to) {
      return (
        <Link to={to} className="group focus:outline-none focus:ring-2 focus:ring-[#20543F]/20 rounded-xl" onClick={onClick}>
          {content}
        </Link>
      );
    }
    return content;
  }

  return null;
};

export default Logo;
