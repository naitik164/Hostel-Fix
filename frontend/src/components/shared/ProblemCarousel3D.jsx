import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  FileText,
  Timer,
  EyeOff,
  UserX,
  FolderArchive,
  XCircle,
  Clock,
  Activity,
  BarChart3,
} from 'lucide-react';

const PROBLEM_CARDS = [
  {
    number: '01',
    title: 'Manual Complaint Reporting',
    description: 'Students often struggle to report maintenance issues through disconnected channels.',
    footerText: 'Lost WhatsApp messages & paper registers',
    icon: FileText,
    footerIcon: XCircle,
  },
  {
    number: '02',
    title: 'Delayed Resolutions',
    description: 'Complaints can remain pending without proper follow-up.',
    footerText: 'No response timelines or priority escalation',
    icon: Timer,
    footerIcon: Clock,
  },
  {
    number: '03',
    title: 'Lack of Transparency',
    description: 'Students have limited visibility into complaint progress.',
    footerText: 'Zero live status updates or technician details',
    icon: EyeOff,
    footerIcon: Activity,
  },
  {
    number: '04',
    title: 'Poor Accountability',
    description: 'Wardens need a structured way to assign tasks and verify completed work.',
    footerText: 'Unverified completions & verbal assurances',
    icon: UserX,
    footerIcon: XCircle,
  },
  {
    number: '05',
    title: 'No Centralized Records',
    description: 'Historical complaints and recurring issues are difficult to monitor.',
    footerText: 'No analytics on block breakdowns or recurring faults',
    icon: FolderArchive,
    footerIcon: BarChart3,
  },
];

// Individual 3D Card with isolated stacking context, opaque background, and ghost-text elimination
const Card3DItem = ({ card, index, continuousIndex, isMobile, reducedMotion }) => {
  const Icon = card.icon;
  const FooterIcon = card.footerIcon;

  // 3D Transform: Active (scale 1, z 0), Upcoming (scale 0.94, y 24px, z -60px), Previous (moves back & fades)
  const transform = useTransform(continuousIndex, (val) => {
    if (reducedMotion) {
      const diff = Math.abs(index - val);
      return diff < 0.5 ? 'scale(1)' : 'scale(0.96)';
    }

    const diff = index - val;

    if (diff >= 0) {
      // Active (diff ~ 0) or Upcoming (diff > 0)
      const clamped = Math.min(diff, 3);
      const scale = 1 - (isMobile ? 0.05 : 0.06) * clamped;
      const y = (isMobile ? 18 : 24) * clamped;
      const z = (isMobile ? -35 : -60) * clamped;
      const rotX = isMobile ? 0 : 2 * clamped;

      return `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg) scale(${scale})`;
    } else {
      // Previous card moving backward and fading out
      const absDiff = Math.min(Math.abs(diff), 1.2);
      const scale = 1 - 0.04 * absDiff;
      const y = -16 * absDiff;
      const z = -40 * absDiff;
      const rotX = isMobile ? 0 : -2 * absDiff;

      return `translate3d(0, ${y}px, ${z}px) rotateX(${rotX}deg) scale(${scale})`;
    }
  });

  // Overall Card Container Opacity
  const opacity = useTransform(continuousIndex, (val) => {
    if (reducedMotion) {
      return Math.abs(index - val) < 0.5 ? 1 : 0;
    }

    const diff = index - val;

    if (diff >= 0) {
      // Active: 1. Upcoming 1: 0.45. Upcoming 2: 0.18. Further: 0.
      if (diff <= 1) return 1 - 0.55 * diff;
      if (diff <= 2) return 0.45 - 0.27 * (diff - 1);
      return Math.max(0, 0.18 - 0.18 * (diff - 2));
    } else {
      // Exiting card: smoothly fades out from 1 to 0
      return Math.max(0, 1 - Math.abs(diff) * 1.6);
    }
  });

  // Inner Content (Text & Icons) Opacity:
  // KEY FIX: When upcoming (diff > 0.15), inner text fades to 0 so only the card silhouette is visible behind.
  // This guarantees zero ghost text or bleeding through the active card.
  const contentOpacity = useTransform(continuousIndex, (val) => {
    if (reducedMotion) {
      return Math.abs(index - val) < 0.5 ? 1 : 0;
    }

    const diff = index - val;

    if (diff >= 0) {
      if (diff <= 0.12) return 1;
      if (diff <= 0.35) return 1 - (diff - 0.12) / 0.23;
      return 0; // Pure solid edge silhouette, NO ghost text!
    } else {
      return Math.max(0, 1 - Math.abs(diff) * 1.5);
    }
  });

  // Z-Index ordering: Active card on top (50), upcoming stacked below (40, 30), exiting is 35
  const zIndex = useTransform(continuousIndex, (val) => {
    const diff = index - val;
    if (Math.abs(diff) < 0.5) return 50;
    if (diff > 0) return Math.max(1, Math.round(45 - diff * 10));
    return Math.max(1, Math.round(35 - Math.abs(diff) * 10));
  });

  // Pointer events: only active card can be interacted with
  const pointerEvents = useTransform(continuousIndex, (val) => {
    return Math.abs(index - val) <= 0.4 ? 'auto' : 'none';
  });

  // Visibility: hide completely outside active range
  const visibility = useTransform(continuousIndex, (val) => {
    const diff = index - val;
    return diff < -0.85 || diff > 2.5 ? 'hidden' : 'visible';
  });

  return (
    <motion.div
      style={{
        transform,
        opacity,
        zIndex,
        pointerEvents,
        visibility,
        isolation: 'isolate',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      className="absolute top-0 left-0 right-0 mx-auto w-full max-w-[480px] p-2"
    >
      {/* 100% Opaque Solid Card Background to ensure no transparency leakage */}
      <div className="relative w-full rounded-[24px] bg-[#F9FBF6] border border-[#A7B88C]/40 p-7 sm:p-9 shadow-[0_20px_50px_-12px_rgba(32,46,34,0.18),0_0_24px_rgba(34,80,59,0.06)] transition-shadow duration-300 overflow-hidden">
        {/* Soft Botanical Ambient Corner Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-[#C3DC9B]/20 via-[#22503B]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Inner Card Content: Fades out on upcoming cards to eliminate ghost text */}
        <motion.div style={{ opacity: contentOpacity }} className="relative z-10">
          {/* Card Header: Problem Number and Icon */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#6A8A64] uppercase">
                ISSUE
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-[#22503B] tracking-tight">
                {card.number}
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#E8EFD3] border border-[#A7B88C]/40 text-[#22503B] flex items-center justify-center shadow-xs">
              <Icon className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* Card Body: Heading & Description */}
          <div className="min-h-[135px] sm:min-h-[145px] flex flex-col justify-start">
            <h3 className="text-xl sm:text-2xl font-heading font-black text-[#2A3F38] leading-snug tracking-tight">
              {card.title}
            </h3>
            <p className="mt-3 text-sm sm:text-[15px] text-[#2A3F38]/80 leading-relaxed">
              {card.description}
            </p>
          </div>

          {/* Card Footer: Supporting Evidence / Pain Point */}
          <div className="mt-6 pt-4 border-t border-[#A7B88C]/30 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#22503B]">
            <FooterIcon className="w-4 h-4 shrink-0 text-[#22503B]" />
            <span className="leading-snug">{card.footerText}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const ProblemCarousel3D = () => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Responsive and motion preference checks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkResponsive = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    checkResponsive();
    window.addEventListener('resize', checkResponsive, { passive: true });

    return () => {
      window.removeEventListener('resize', checkResponsive);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Track scroll position across the 500vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Spring smoothing for responsive 1:1 scroll control
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.3,
    restDelta: 0.0001,
  });

  // Map scroll progress across the 5 cards with reading plateaus and smooth intervals
  const continuousIndex = useTransform(
    smoothProgress,
    [0, 0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80, 0.92, 1.0],
    [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]
  );

  // Update left column active number indicator when rounded index changes
  useEffect(() => {
    const unsubscribe = continuousIndex.on('change', (latest) => {
      const rounded = Math.min(4, Math.max(0, Math.round(latest)));
      setActiveIndex(rounded);
    });

    return () => unsubscribe();
  }, [continuousIndex]);

  // Height of vertical progress fill line (18% to 100%)
  const progressLineHeight = useTransform(smoothProgress, [0, 1], ['18%', '100%']);

  const activeCard = PROBLEM_CARDS[activeIndex] || PROBLEM_CARDS[0];

  return (
    <section
      id="problem"
      ref={containerRef}
      className="relative bg-[#2A3F38] border-t border-[#354E45]"
      style={{ height: '500vh' }}
    >
      {/* 
        TRUE PINNED / STICKY VIEWPORT CONTAINER
        Locks to the viewport (top: 0, height: 100vh) while parent 500vh container scrolls.
        Contains BOTH the left content and right carousel so they remain stationary.
      */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-20 pt-16 sm:pt-20">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C3DC9B]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-[#22503B]/25 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 h-full flex flex-col justify-center relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">

            {/* =================================================================
                LEFT COLUMN (40% width): Completely Stationary During Transitions
                ================================================================= */}
            <div className="lg:col-span-5 flex flex-col justify-center">


              {/* Main Headline */}
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-[#EBECDE] tracking-tight leading-[1.14]">
                Hostel Problems Shouldn't{' '}
                <span className="bg-gradient-to-r from-[#C3DC9B] via-[#DADFB9] to-[#F9FBF6] bg-clip-text text-transparent block sm:inline">
                  Remain Unresolved.
                </span>
              </h2>



              {/* Stationary Progress Section: Counter, Fill Line & Indicators */}
              <div className="mt-6 sm:mt-10 flex items-center gap-6">
                {/* Vertical Progress Line */}
                <div className="relative w-1.5 h-28 sm:h-32 bg-[#202E22] border border-[#354E45] rounded-full overflow-hidden shrink-0">
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#C3DC9B] to-[#22503B] rounded-full"
                    style={{ height: progressLineHeight }}
                  />
                </div>

                {/* Counter & 5 Indicator Bars */}
                <div className="flex flex-col justify-between h-28 sm:h-32 py-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-mono font-black text-[#C3DC9B] tracking-tight">
                      {activeCard.number}
                    </span>
                    <span className="text-sm font-mono font-bold text-[#A7B88C]">
                      / 05
                    </span>
                  </div>

                  {/* 5 Step Indicator Bars */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {PROBLEM_CARDS.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${activeIndex === idx
                          ? 'w-7 sm:w-8 bg-[#C3DC9B] shadow-xs'
                          : 'w-2 bg-[#A7B88C]/35'
                          }`}
                      />
                    ))}
                  </div>

                  {/* Active Card Title Beneath Progress Indicator */}
                  <p className="text-xs font-semibold text-[#C1CEA6] truncate max-w-[260px] transition-all duration-200">
                    {activeCard.title}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================================
                RIGHT COLUMN (60% width): 3D Layered Carousel Stack
                ================================================================= */}
            <div className="lg:col-span-7 flex items-center justify-center relative w-full">
              <div
                className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center"
                style={{
                  perspective: isMobile ? 900 : 1400,
                  transformStyle: 'preserve-3d',
                }}
              >
                {PROBLEM_CARDS.map((card, index) => (
                  <Card3DItem
                    key={card.number}
                    card={card}
                    index={index}
                    continuousIndex={continuousIndex}
                    isMobile={isMobile}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemCarousel3D;
