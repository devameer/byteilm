/**
 * Animation Utilities Hook
 * توفر animations جاهزة قابلة لإعادة الاستخدام بسهولة
 */

export const useAnimations = () => {
  // Fade Animations
  const fadeIn = "animate-fade-in";
  const fadeInUp = "animate-fade-in-up";
  const fadeInDown = "animate-fade-in-down";

  // Slide Animations
  const slideInRight = "animate-slide-in-right";
  const slideInLeft = "animate-slide-in-left";

  // Scale Animation
  const scaleIn = "animate-scale-in";

  // Soft Animations
  const bounceSoft = "animate-bounce-soft";
  const pulseSoft = "animate-pulse-soft";

  // Special Effects
  const shimmer = "animate-shimmer";
  const float = "animate-float";
  const glow = "animate-glow";

  // Hover Effects
  const hoverLift = "hover-lift smooth-transition";
  const hoverScale = "hover-scale";
  const hoverGlow = "hover-glow";

  // Combined Effects
  const cardAnimation = `${fadeIn} ${hoverLift}`;
  const buttonAnimation = `${scaleIn} smooth-transition`;
  const listItemAnimation = `${fadeInUp} ${hoverLift}`;

  return {
    // Individual animations
    fadeIn,
    fadeInUp,
    fadeInDown,
    slideInRight,
    slideInLeft,
    scaleIn,
    bounceSoft,
    pulseSoft,
    shimmer,
    float,
    glow,
    hoverLift,
    hoverScale,
    hoverGlow,

    // Combined effects
    cardAnimation,
    buttonAnimation,
    listItemAnimation,
  };
};

/**
 * Stagger Animation Helper
 * يضيف تأخير تدريجي للعناصر في القوائم
 * @param {number} index - Index of the element
 * @param {number} delay - Delay in milliseconds between elements
 */
export const staggerAnimation = (index, delay = 100) => ({
  animationDelay: `${index * delay}ms`,
  animationFillMode: 'backwards'
});

/**
 * Page Transition Hook
 * يدير انتقالات الصفحات
 */
export const usePageTransition = () => {
  const transitionClass = "animate-fade-in";
  const transitionDuration = 500; // milliseconds

  return {
    transitionClass,
    transitionDuration
  };
};

export default useAnimations;
