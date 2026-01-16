// Inactivity tracker for automatic logout
// Token expires after 10 minutes of inactivity

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
let inactivityTimer: NodeJS.Timeout | null = null;

export const initInactivityTracker = (onInactivity: () => void) => {
  const resetTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
      onInactivity();
    }, INACTIVITY_TIMEOUT);
  };

  // Events that indicate user activity
  const events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ];

  // Add event listeners for all activity events
  events.forEach((event) => {
    document.addEventListener(event, resetTimer, true);
  });

  // Initial timer setup
  resetTimer();

  // Return cleanup function
  return () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    events.forEach((event) => {
      document.removeEventListener(event, resetTimer, true);
    });
  };
};

export const stopInactivityTracker = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};
