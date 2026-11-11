import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CookieBanner } from '@/components/SupportComponents/CookieBanner';
import { ADS_CONSENT_KEY, COOKIE_CONSENT_KEY } from '@/lib/utils/consent';

const BANNER_TITLE = 'Cenimy Twoją prywatność';

const clearCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const cookieValue = (name: string) =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')[1];

describe('CookieBanner', () => {
  beforeEach(() => {
    clearCookie(COOKIE_CONSENT_KEY);
    clearCookie(ADS_CONSENT_KEY);
  });

  afterEach(cleanup);

  it('asks again a visitor who only answered the earlier analytics-only banner', () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=granted; path=/`;

    render(<CookieBanner />);

    expect(screen.getByText(BANNER_TITLE)).toBeTruthy();
  });

  it('stays hidden once both choices are made', () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=denied; path=/`;
    document.cookie = `${ADS_CONSENT_KEY}=granted; path=/`;

    render(<CookieBanner />);

    expect(screen.queryByText(BANNER_TITLE)).toBeNull();
  });

  it('grants both choices with „Akceptuję wszystkie”', () => {
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Akceptuję wszystkie' }));

    expect(cookieValue(COOKIE_CONSENT_KEY)).toBe('granted');
    expect(cookieValue(ADS_CONSENT_KEY)).toBe('granted');
    expect(screen.queryByText(BANNER_TITLE)).toBeNull();
  });

  it('denies both choices with „Tylko niezbędne”', () => {
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Tylko niezbędne' }));

    expect(cookieValue(COOKIE_CONSENT_KEY)).toBe('denied');
    expect(cookieValue(ADS_CONSENT_KEY)).toBe('denied');
  });

  it('saves separate choices from the settings', () => {
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Ustawienia' }));
    fireEvent.click(screen.getByRole('switch', { name: /Reklamowe/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz wybór' }));

    expect(cookieValue(COOKIE_CONSENT_KEY)).toBe('denied');
    expect(cookieValue(ADS_CONSENT_KEY)).toBe('granted');
  });

  it('preselects the earlier analytics choice in the settings', () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=granted; path=/`;
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Ustawienia' }));

    expect(screen.getByRole('switch', { name: /Analityczne/ }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(screen.getByRole('switch', { name: /Reklamowe/ }).getAttribute('aria-checked')).toBe(
      'false'
    );
  });
});
