import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAutosave } from './useAutosave';

type TestSave = (payload: { revision: number }, signal: AbortSignal) => Promise<void>;

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('useAutosave', () => {
  it('flushes a pending debounce exactly once', async () => {
    vi.useFakeTimers();
    const save = vi.fn<TestSave>().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ value: { revision: 1 }, enabled: true, delay: 1_000 })
    );

    act(() => result.current.trigger(save));

    await act(async () => {
      result.current.pause();
      await result.current.flush(save);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]?.[0]).toEqual({ revision: 1 });

    act(() => vi.advanceTimersByTime(2_000));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('waits for an in-flight save before flushing the latest value', async () => {
    vi.useFakeTimers();
    const firstSave = deferred();
    let concurrentSaves = 0;
    let maxConcurrentSaves = 0;

    const save = vi.fn(async (payload: { revision: number }) => {
      concurrentSaves += 1;
      maxConcurrentSaves = Math.max(maxConcurrentSaves, concurrentSaves);

      if (payload.revision === 1) {
        await firstSave.promise;
      }

      concurrentSaves -= 1;
    });

    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, enabled: true, delay: 100 }),
      { initialProps: { value: { revision: 1 } } }
    );

    act(() => {
      result.current.trigger(save);
      vi.advanceTimersByTime(100);
    });

    expect(save).toHaveBeenCalledTimes(1);

    rerender({ value: { revision: 2 } });
    act(() => {
      result.current.trigger(save);
      result.current.pause();
    });

    const flushPromise = result.current.flush(save);
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstSave.resolve();
      await flushPromise;
    });

    expect(save.mock.calls.map(([payload]) => payload.revision)).toEqual([1, 2]);
    expect(maxConcurrentSaves).toBe(1);
  });

  it('does not save a hydrated value after reset and resume', () => {
    vi.useFakeTimers();
    const save = vi.fn<TestSave>().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, enabled: true, delay: 100 }),
      { initialProps: { value: { revision: 1 } } }
    );

    act(() => {
      result.current.trigger(save);
      result.current.pause();
      result.current.reset({ revision: 1 });
    });

    rerender({ value: { revision: 2 } });
    act(() => {
      result.current.trigger(save);
      result.current.reset({ revision: 2 });
      result.current.resume();
      vi.advanceTimersByTime(200);
    });

    expect(save).not.toHaveBeenCalled();
  });

  it('persists a revert made while a newer value is still saving', async () => {
    vi.useFakeTimers();
    const newerSave = deferred();
    const save = vi.fn(async (payload: { revision: number }) => {
      if (payload.revision === 2) {
        await newerSave.promise;
      }
    });

    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, enabled: true, delay: 100 }),
      { initialProps: { value: { revision: 1 } } }
    );

    act(() => {
      result.current.trigger(save);
      result.current.reset({ revision: 1 });
    });

    rerender({ value: { revision: 2 } });
    act(() => {
      result.current.trigger(save);
      vi.advanceTimersByTime(100);
    });

    rerender({ value: { revision: 1 } });
    act(() => {
      result.current.trigger(save);
      vi.advanceTimersByTime(100);
    });

    await act(async () => {
      newerSave.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(save.mock.calls.map(([payload]) => payload.revision)).toEqual([2, 1]);
  });
});
