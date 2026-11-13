import React, { useState, useEffect, useRef } from 'react';

/**
 * PremiumPageLoader
 * 
 * A calm, elegant, cinematic loading experience inspired by Apple, Linear, and Stripe.
 * Carefully timed sequence:
 *  - 0-1200ms: Ambient backdrop fade-in & 6-8s floating orbs
 *  - 150-1200ms: Logo cinematic reveal (900-1200ms) with scale 0.88 -> 1.0 & calm breathing
 *  - 350-1100ms: Staggered brand title reveal
 *  - 550-1300ms: Staggered tagline reveal (600-800ms)
 *  - 750-1450ms: Staggered progress bar entrance
 *  - 800-2400ms: Fluid progress animation & 500ms text crossfades
 *  - 2500-3400ms: Connected multi-stage exit (content fade-out -> backdrop scale & fade -> 900ms website reveal)
 */
const DEFAULT_MIN_SHOWCASE_MS = 500; // Snappy 500ms visual experience when ready
const DEFAULT_MAX_FALLBACK_TIMEOUT_MS = 2500; // 2.5s maximum safeguard - never freeze or hold the screen indefinitely

const PremiumPageLoader = ({
  isReady = false,
  onComplete,
  tagline = 'Complaint • Maintenance • Resolution',
  customMessage,
  minShowcaseMs = DEFAULT_MIN_SHOWCASE_MS,
  maxFallbackMs = DEFAULT_MAX_FALLBACK_TIMEOUT_MS,
}) => {
  const [progress, setProgress] = useState(0);
  const [isExitingContent, setIsExitingContent] = useState(false);
  const [isExitingBackdrop, setIsExitingBackdrop] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Smooth text crossfade state
  const [displayedText, setDisplayedText] = useState('Initializing your experience...');
  const [textOpacity, setTextOpacity] = useState(1);
  const currentTextRef = useRef('Initializing your experience...');

  const startTimeRef = useRef(Date.now());
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  // Function to smoothly crossfade loading messages (400-600ms total)
  const setSmoothStatus = (newText) => {
    if (currentTextRef.current === newText) return;
    currentTextRef.current = newText;
    setTextOpacity(0);
    setTimeout(() => {
      setDisplayedText(newText);
      setTextOpacity(1);
    }, 220); // 220ms fade-out + 280ms fade-in = 500ms smooth crossfade
  };

  useEffect(() => {
    let animFrameId;
    let exitTriggered = false;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const ready = isReadyRef.current;

      if (!exitTriggered) {
        const isTimeCapped = elapsed >= maxFallbackMs;
        if ((ready && elapsed >= minShowcaseMs) || isTimeCapped) {
          // Both application is ready (or maximum safeguard timeout elapsed)
          exitTriggered = true;
          setProgress(100);
          setSmoothStatus('Ready...');

          // Stage 1: Fade out logo, tagline, and progress bar smoothly (over 500ms)
          setTimeout(() => {
            setIsExitingContent(true);

            // Stage 2: Fade & scale out backdrop (over 850ms)
            setTimeout(() => {
              setIsExitingBackdrop(true);

              // Stage 3: Complete and unmount after backdrop has completely faded out
              setTimeout(() => {
                setIsMounted(false);
                if (onComplete) onComplete();
              }, 880);
            }, 180);
          }, 350);

          return;
        }

        // Calculate progress curve
        if (elapsed < 800) {
          // Entrance phase: logo & typography reveal
          const p = (elapsed / 800) * 26;
          setProgress(Math.min(26, p));
          setSmoothStatus(customMessage || 'Initializing your experience...');
        } else if (elapsed < 1600) {
          // Dashboard preparation phase
          const ratio = (elapsed - 800) / 800;
          const p = 26 + ratio * 42; // reaches 68%
          setProgress(p);
          setSmoothStatus(customMessage || 'Preparing your dashboard...');
        } else if (elapsed < 2300) {
          // Approaching readiness phase
          const ratio = (elapsed - 1600) / 700;
          const p = 68 + ratio * 20; // reaches 88%
          setProgress(p);
          setSmoothStatus(customMessage || 'Almost there...');
        } else {
          // If elapsed >= 2300ms but app is still waiting on actual backend readiness:
          if (!ready && elapsed < maxFallbackMs - 300) {
            // Eases gently toward 92% and naturally holds without stalling or jumping
            setProgress((prev) => Math.min(92, prev + 0.15));
            setSmoothStatus(customMessage || 'Finalizing secure connection...');
          } else {
            // App is ready or approaching safeguard ceiling: glide smoothly toward 100%
            const ratio = Math.min(1, (elapsed - 2300) / 200);
            setProgress(88 + ratio * 12);
            setSmoothStatus('Ready...');
          }
        }
      }

      if (!exitTriggered || !isExitingBackdrop) {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [onComplete, customMessage]);

  if (!isMounted) return null;

  return (
    <aside
      aria-label="Loading HostelFix"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#173D30] overflow-hidden select-none animate-backdrop-entrance transition-all duration-[850ms] ${
        isExitingBackdrop ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {/* Ambient background lighting orbs (slow continuous 6-8s movement) */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#20543F]/35 filter blur-[105px] pointer-events-none animate-orb-1"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[540px] h-[540px] rounded-full bg-[#00A878]/25 filter blur-[115px] pointer-events-none animate-orb-2"
        style={{ willChange: 'transform' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-[#A8B99A]/15 filter blur-[95px] pointer-events-none"
      />

      {/* Subtle high-tech dot matrix grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Main Content Container with staggered reveals & smooth exit */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full transition-all duration-500 ${
          isExitingContent ? 'opacity-0 -translate-y-2 scale-[0.97]' : 'opacity-100 translate-y-0 scale-100'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity, transform',
        }}
      >
        {/* Logo Container: Smooth reveal (1050ms) from scale 0.88 to 1.0 with subtle calm breathing */}
        <div className="relative group animate-logo-reveal">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-[24px] bg-gradient-to-br from-white/15 via-white/5 to-white/0 backdrop-blur-2xl border border-[#A8B99A]/30 shadow-[0_0_40px_rgba(32,84,63,0.45)] flex items-center justify-center p-3 relative overflow-hidden animate-logo-breathe">
            {/* Gentle shimmer highlight sweep across icon */}
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-shimmer-sweep"
              style={{ willChange: 'transform' }}
            />

            <img
              src="/hostelfix-icon.webp"
              srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w, /hostelfix-icon-256.webp 256w"
              sizes="(max-width: 640px) 56px, 64px"
              alt="HostelFix Logo"
              width="64"
              height="64"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-md relative z-10 select-none"
            />
          </div>

          {/* Under-glow ring */}
          <div className="absolute -inset-1 rounded-[26px] bg-gradient-to-r from-[#20543F]/40 via-[#00A878]/30 to-[#A8B99A]/40 blur-md -z-10 opacity-70" />
        </div>

        {/* Brand Title: Staggered smooth entrance */}
        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-white animate-title-entrance">
          Hostel<span className="text-[#A8B99A]">Fix</span>
        </h1>

        {/* Brand Tagline: Staggered smooth appearance (600-800ms) with slight delay */}
        <p className="mt-1.5 text-xs sm:text-sm text-[#E9EDDA]/80 font-medium tracking-wide animate-tagline-entrance">
          {tagline}
        </p>

        {/* Progress Bar Container: Staggered entrance */}
        <div className="w-full max-w-[270px] mt-8 animate-progress-entrance">
          {/* Progress Track */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-md border border-white/5 relative p-[1px]">
            {/* Smooth gradient fill with cubic-bezier transition */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#20543F] via-[#00A878] to-[#A8B99A] relative transition-all duration-350 ease-out shadow-[0_0_12px_rgba(0,168,120,0.7)]"
              style={{
                width: `${progress}%`,
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'width',
              }}
            >
              {/* Subtle leading glow pip */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full opacity-85 filter blur-[1px]" />
            </div>
          </div>

          {/* Dynamic Status & Percentage with 400-600ms crossfade */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-300 font-medium">
            <span
              className="text-[#E9EDDA] font-medium tracking-wide font-sans transition-opacity duration-300 ease-in-out"
              style={{ opacity: textOpacity }}
            >
              {displayedText}
            </span>
            <span className="font-mono text-[#E9EDDA] text-xs font-semibold tracking-wider">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PremiumPageLoader;
