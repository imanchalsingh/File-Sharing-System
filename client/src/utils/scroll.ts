/**
 * Cubic ease-in-out easing function.
 * @param t Current progress normalized (0 to 1)
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Calculates scroll percentage between 0 and 1.
 * @param scrollY Current vertical scroll position
 * @param documentHeight Total scrollable height of the document
 * @param windowHeight Outer viewport height of the window
 */
export const calculateScrollPercentage = (
  scrollY: number,
  documentHeight: number,
  windowHeight: number
): number => {
  const maxScroll = documentHeight - windowHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(scrollY / maxScroll, 0), 1);
};

/**
 * Animates scroll to a target vertical position.
 * Returns a function to cancel the animation.
 * Cancels automatically on user interaction.
 */
export const animateScrollTo = (
  targetY: number,
  duration: number,
  onComplete?: () => void
): (() => void) => {
  const startY = window.scrollY || document.documentElement.scrollTop;
  const difference = targetY - startY;
  const startTime = performance.now();
  let animationFrameId: number;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startY + difference * ease);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      if (onComplete) onComplete();
      cleanup();
    }
  };

  const cancel = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchmove", cancel);
    window.removeEventListener("keydown", cancel);
    window.removeEventListener("mousedown", cancel);
  };

  // Add event listeners to cancel scroll on user interaction
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchmove", cancel, { passive: true });
  window.addEventListener("keydown", cancel, { passive: true });
  window.addEventListener("mousedown", cancel, { passive: true });

  animationFrameId = requestAnimationFrame(step);

  return cancel;
};
