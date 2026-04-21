import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Provides a short-lived undo state window for a recently created resource.
 */
export default function useUndoTimer(durationMs = 5000) {
  const [isUndoAvailable, setIsUndoAvailable] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearUndoState = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsUndoAvailable(false);
    setActiveId(null);
  }, []);

  const startUndoWindow = useCallback(
    (id: string) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      setActiveId(id);
      setIsUndoAvailable(true);

      timeoutRef.current = window.setTimeout(() => {
        setIsUndoAvailable(false);
        setActiveId(null);
        timeoutRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    isUndoAvailable,
    activeId,
    startUndoWindow,
    clearUndoState,
  };
}
