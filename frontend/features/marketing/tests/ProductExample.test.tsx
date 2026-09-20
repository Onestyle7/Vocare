import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import ProductExample from '@/app/(marketing)/main-components/ProductExample';
import { AuthProvider } from '@/features/auth/components/AuthProvider';

afterEach(cleanup);

describe('ProductExample', () => {
  it('renders all three examples on the server', () => {
    const html = renderToString(<ProductExample />);

    expect(html).toContain('Junior Customer Success Specialist');
    expect(html).toContain('Przećwicz wdrożenie klienta');
    expect(html).toContain('Po uporządkowaniu pod ofertę');
  });

  it('supports arrow keys, wraparound, Home and End with a single active tab and panel', () => {
    render(<ProductExample />);
    const tabs = screen.getAllByRole('tab');

    tabs[0].focus();
    for (const [key, expectedIndex] of [
      ['ArrowLeft', 2],
      ['ArrowRight', 0],
      ['ArrowRight', 1],
      ['End', 2],
      ['Home', 0],
    ] as const) {
      fireEvent.keyDown(document.activeElement!, { key });

      expect(document.activeElement).toBe(tabs[expectedIndex]);
      expect(tabs[expectedIndex].getAttribute('aria-selected')).toBe('true');
      expect(tabs.filter((tab) => tab.tabIndex === 0)).toEqual([tabs[expectedIndex]]);
      const panels = screen.getAllByRole('tabpanel');
      expect(panels).toHaveLength(1);
      expect(panels[0].id).toBe(tabs[expectedIndex].getAttribute('aria-controls'));
      expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[expectedIndex].id);
    }
  });

  it('switches examples on click', () => {
    render(<ProductExample />);
    fireEvent.click(screen.getByRole('tab', { name: 'Plan' }));
    expect(screen.getByRole('tabpanel').textContent).toContain('Wiesz, od czego zacząć');
    fireEvent.click(screen.getByRole('tab', { name: 'CV' }));
    expect(screen.getByRole('tabpanel').textContent).toContain('Pokaż to, co pasuje do oferty');
  });

  it.each([
    [false, '/sign-up'],
    [true, '/dashboard'],
  ] as const)('routes the CTA for authenticated=%s to %s', (isAuthenticated, destination) => {
    render(
      <AuthProvider isAuthenticated={isAuthenticated}>
        <ProductExample />
      </AuthProvider>
    );
    const cta = screen.getByRole('link', { name: 'Sprawdź dla swojego profilu' });
    expect(cta.getAttribute('href')).toBe(destination);
  });
});
