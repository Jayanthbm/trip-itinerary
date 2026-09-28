import { useRef, useCallback, useEffect } from 'react';

// Debounced persistence for high-frequency inputs (REVIEW_READINESS_PLAN.md
// P0-7, G8). Edit mode currently writes the whole trip to IndexedDB on every
// keystroke; review inputs (and future edit-mode work) go through this instead.
//
// Usage:
//   const { save, flush, cancel } = useDebouncedSave(saveFn, 400);
//   save(value);      // schedules; latest value wins
//   flush();          // force the pending write now (tab switch / close)
//   cancel();         // drop the pending write
//
// Holds only the latest value — no state, no re-renders. Unmount flushes so
// nothing typed just before leaving the screen is lost.
export const useDebouncedSave = (saveFn, delay = 400) => {
  const timerRef = useRef(null);
  const latestRef = useRef({ hasValue: false, value: undefined });
  const saveFnRef = useRef(saveFn);

  // Keep the latest saveFn without re-creating callbacks or touching refs
  // during render (react-hooks/immutability).
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (latestRef.current.hasValue) {
      const { value } = latestRef.current;
      latestRef.current = { hasValue: false, value: undefined };
      saveFnRef.current(value);
    }
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    latestRef.current = { hasValue: false, value: undefined };
  }, []);

  const save = useCallback(
    (value) => {
      latestRef.current = { hasValue: true, value };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, delay);
    },
    [flush, delay]
  );

  // Flush pending writes on unmount.
  useEffect(() => () => flush(), [flush]);

  return { save, flush, cancel };
};

export default useDebouncedSave;
