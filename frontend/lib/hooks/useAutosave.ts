import { useEffect, useRef, useState } from 'react';

type SaveFn<T> = (payload: T, signal: AbortSignal) => Promise<void>;

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stableStringify = (obj: unknown): string => {
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  };

  const getHash = (v: T): string => stableStringify(v);

  const trigger = async (save: SaveFn<T>) => {
    if (!enabled) return;

    // Pomijamy pierwszy autosave po wczytaniu profilu (jeśli proszono)
    if (skipOnce) {
      onSkipConsumed?.();
      return;
    }

    const h = getHash(value);
    if (h === lastHashRef.current) return; // brak zmian

    // debounce
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // cancel poprzedniego zapisu
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setStatus('saving');
      try {
        await save(value, ac.signal);
        lastHashRef.current = h;
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1200);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return; // przerwany przez następny zapis
        setStatus('error');
      }
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { status, trigger };
}