import { useState, useEffect } from 'react';

/**
 * Responsive Design Hook
 * يوفر معلومات عن حجم الشاشة والجهاز الحالي
 */

export const breakpoints = {
  sm: 640,   // Mobile
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large Desktop
  '2xl': 1536 // Extra Large
};

export const useResponsive = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Device checks
  const isMobile = windowWidth < breakpoints.md;
  const isTablet = windowWidth >= breakpoints.md && windowWidth < breakpoints.lg;
  const isDesktop = windowWidth >= breakpoints.lg;
  const isLargeDesktop = windowWidth >= breakpoints.xl;

  // Breakpoint checks
  const isSmallScreen = windowWidth < breakpoints.sm;
  const isMediumScreen = windowWidth >= breakpoints.sm && windowWidth < breakpoints.md;
  const isLargeScreen = windowWidth >= breakpoints.md && windowWidth < breakpoints.lg;
  const isExtraLargeScreen = windowWidth >= breakpoints.lg;

  return {
    windowWidth,

    // Device types
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,

    // Screen sizes
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isExtraLargeScreen,

    // Orientation (for mobile/tablet)
    isPortrait: typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches,
    isLandscape: typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches,

    // Breakpoints
    breakpoints
  };
};

export default useResponsive;
