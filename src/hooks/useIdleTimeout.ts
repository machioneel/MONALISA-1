import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimeout = (timeoutMinutes: number, onIdle: () => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Jika waktu habis, panggil fungsi onIdle dari parameter
  const handleIdle = useCallback(() => {
    onIdle();
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(handleIdle, timeoutMinutes * 60 * 1000);
  }, [handleIdle, timeoutMinutes]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    resetTimer();
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);
};