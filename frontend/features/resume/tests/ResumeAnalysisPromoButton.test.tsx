import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResumeAnalysisPromoButton } from '../components/ResumeAnalysisPromoButton';

vi.mock('next/image', () => ({
  default: () => <span data-testid="analysis-icon" />,
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('ResumeAnalysisPromoButton', () => {
  it('shows the feature label for the first five seconds', () => {
    render(<ResumeAnalysisPromoButton cvId="promo-duration-cv" onAnalyze={vi.fn()} />);

    const label = screen.getByText('Przeanalizuj swoje CV');
    expect(label.dataset.state).toBe('visible');

    act(() => vi.advanceTimersByTime(4_999));
    expect(label.dataset.state).toBe('visible');

    act(() => vi.advanceTimersByTime(1));
    expect(label.dataset.state).toBe('hidden');
  });

  it('opens the analysis and dismisses the label when clicked', () => {
    const onAnalyze = vi.fn();
    render(<ResumeAnalysisPromoButton cvId="promo-click-cv" onAnalyze={onAnalyze} />);

    fireEvent.click(screen.getByRole('button', { name: 'Przeanalizuj swoje CV' }));

    expect(onAnalyze).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Przeanalizuj swoje CV').dataset.state).toBe('hidden');
  });

  it('stays disabled and does not promote analysis before the CV exists', () => {
    const onAnalyze = vi.fn();
    render(<ResumeAnalysisPromoButton cvId={null} onAnalyze={onAnalyze} />);

    const button = screen.getByRole('button', { name: 'Przeanalizuj swoje CV' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('Przeanalizuj swoje CV')).toBeNull();

    fireEvent.click(button);
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('does not restart the five-second window after an immediate editor remount', () => {
    const firstRender = render(
      <ResumeAnalysisPromoButton cvId="promo-remount-cv" onAnalyze={vi.fn()} />
    );

    act(() => vi.advanceTimersByTime(2_000));
    firstRender.unmount();
    act(() => vi.advanceTimersByTime(500));

    render(<ResumeAnalysisPromoButton cvId="promo-remount-cv" onAnalyze={vi.fn()} />);
    const label = screen.getByText('Przeanalizuj swoje CV');
    expect(label.dataset.state).toBe('visible');

    act(() => vi.advanceTimersByTime(2_499));
    expect(label.dataset.state).toBe('visible');

    act(() => vi.advanceTimersByTime(1));
    expect(label.dataset.state).toBe('hidden');
  });
});
