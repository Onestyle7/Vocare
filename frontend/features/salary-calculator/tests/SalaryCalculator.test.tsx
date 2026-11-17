import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SalaryCalculator from '@/features/salary-calculator/components/SalaryCalculator';

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock('@/lib/utils/tracking', () => ({ trackEvent }));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('SalaryCalculator usage tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('reports nothing when the calculator is only displayed', () => {
    render(<SalaryCalculator />);

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('reports usage once per visit, with the tool name and no amounts', () => {
    render(<SalaryCalculator />);

    const amount = screen.getByLabelText('Wynagrodzenie brutto miesięcznie');
    fireEvent.change(amount, { target: { value: '9000' } });
    fireEvent.change(amount, { target: { value: '12000' } });
    fireEvent.click(screen.getByRole('switch', { name: /Mam mniej niż 26 lat/ }));

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('ToolUsed', { toolName: 'salary_calculator' });
  });

  it('counts choosing a contract type as usage', () => {
    render(<SalaryCalculator />);

    fireEvent.click(screen.getByRole('button', { name: /Umowa zlecenie/ }));

    expect(trackEvent).toHaveBeenCalledOnce();
  });
});
