import { useCallback, useEffect, useRef, useState } from 'react';

type SaveFn<T> = (payload: T, signal: AbortSignal) => Promise<void>;

const stableStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
};

export function useAutosave<T>({
  value,
  enabled,
  delay = 3000,
  skipOnce = false,
  onSkipConsumed,
}: {
  value: T;
  enabled: boolean;
  delay?: number;
  /**
   * jeśli true — pierwszy trigger zostanie pominięty (np. tuż po "Load profile")
   */
  skipOnce?: boolean;
  /**
   * wywołane po pominięciu pierwszego triggera (ustaw false w komponencie)
   */
  onSkipConsumed?: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastHashRef = useRef<string>('');
  const valueRef = useRef(value);
  const saveRef = useRef<SaveFn<T> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const queuedHashRef = useRef<string | null>(null);
  const pausedRef = useRef(false);
  const mountedRef = useRef(true);

  valueRef.current = value;

  const clearDebounce = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const clearStatusTimer = useCallback(() => {
    if (!statusTimerRef.current) return;
    clearTimeout(statusTimerRef.current);
    statusTimerRef.current = null;
  }, []);

  const runSave = useCallback(
    async (payload: T, hash: string, save: SaveFn<T>) => {
      const previousSave = inFlightRef.current;
      const currentSave = (async () => {
        // Server Actions nie są realnie anulowane przez AbortSignal, dlatego zapisy
        // serializujemy i czekamy na poprzedni zamiast pozwalać im się wyprzedzać.
        if (previousSave) {
          await previousSave.catch(() => undefined);
        }

        if (!mountedRef.current) return;

        clearStatusTimer();
        const abortController = new AbortController();
        abortRef.current = abortController;
        setStatus('saving');

        try {
          await save(payload, abortController.signal);
          lastHashRef.current = hash;
          if (mountedRef.current) {
            setStatus('saved');
            statusTimerRef.current = setTimeout(() => {
              if (mountedRef.current) setStatus('idle');
            }, 1200);
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          if (mountedRef.current) setStatus('error');
          throw error;
        }
      })();

      inFlightRef.current = currentSave;
      queuedHashRef.current = hash;

      try {
        await currentSave;
      } finally {
        if (inFlightRef.current === currentSave) {
          inFlightRef.current = null;
          queuedHashRef.current = null;
        }
      }
    },
    [clearStatusTimer]
  );

  const scheduleLatest = useCallback(() => {
    if (!enabled || pausedRef.current || !saveRef.current) return;

    clearDebounce();
    const payload = valueRef.current;
    const hash = stableStringify(payload);
    if (hash === queuedHashRef.current) return;
    if (hash === lastHashRef.current && !inFlightRef.current) return;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const save = saveRef.current;
      if (!save || pausedRef.current) return;
      void runSave(payload, hash, save).catch(() => undefined);
    }, delay);
  }, [clearDebounce, delay, enabled, runSave]);

  const trigger = useCallback(
    (save: SaveFn<T>) => {
      saveRef.current = save;
      if (!enabled || pausedRef.current) return;

      if (skipOnce) {
        clearDebounce();
        onSkipConsumed?.();
        return;
      }

      scheduleLatest();
    },
    [clearDebounce, enabled, onSkipConsumed, scheduleLatest, skipOnce]
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearDebounce();
  }, [clearDebounce]);

  const flush = useCallback(
    async (save?: SaveFn<T>) => {
      if (save) saveRef.current = save;
      clearDebounce();

      const pendingSave = inFlightRef.current;
      if (pendingSave) {
        await pendingSave.catch(() => undefined);
      }

      const latestSave = saveRef.current;
      if (!latestSave) return;

      const payload = valueRef.current;
      const hash = stableStringify(payload);
      if (hash === lastHashRef.current) return;

      await runSave(payload, hash, latestSave);
    },
    [clearDebounce, runSave]
  );

  const resume = useCallback(() => {
    pausedRef.current = false;
    scheduleLatest();
  }, [scheduleLatest]);

  const reset = useCallback(
    (savedValue?: T) => {
      clearDebounce();
      clearStatusTimer();
      lastHashRef.current = stableStringify(savedValue ?? valueRef.current);
      setStatus('idle');
    },
    [clearDebounce, clearStatusTimer]
  );

  useEffect(() => {
    if (!enabled) clearDebounce();
  }, [clearDebounce, enabled]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearDebounce();
      clearStatusTimer();
      abortRef.current?.abort();
    };
  }, [clearDebounce, clearStatusTimer]);

  return { status, trigger, pause, flush, resume, reset };
}
