import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopNavigationLoader
 * 
 * Sleek, high-precision top loading bar that triggers on route navigation
 * (inspired by Linear, Apple, GitHub, and YouTube).
 * Provides immediate feedback without jarring full-screen interruptions.
 */
const TopNavigationLoader = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid triggering on initial mount since PremiumPageLoader covers that
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Route changed: trigger navigation progress
    setVisible(true);
    setProgress(20);

    const step1 = setTimeout(() => {
      setProgress(68);
    }, 80);

    const step2 = setTimeout(() => {
      setProgress(100);
    }, 220);

    const cleanup = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(cleanup);
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-[2.5px] bg-gradient-to-r from-royal via-electric to-sky transition-all duration-200 ease-out shadow-[0_0_12px_rgba(55,129,252,0.9),0_0_6px_rgba(25,81,252,0.7)]"
        style={{
          width: `${progress}%`,
          willChange: 'width',
        }}
      />
    </div>
  );
};

export default TopNavigationLoader;

