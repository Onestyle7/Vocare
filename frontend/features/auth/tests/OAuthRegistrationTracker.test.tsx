import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuthRegistrationTracker } from '@/features/auth/components/OAuthRegistrationTracker';
import { NEW_OAUTH_USER_COOKIE } from '@/lib/utils/tracker-data';

describe('OAuthRegistrationTracker', () => {
  const track = vi.fn();

  beforeEach(() => {
    track.mockClear();
    document.cookie = `${NEW_OAUTH_USER_COOKIE}=; max-age=0; path=/`;
    window.ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track };
  });

  afterEach(() => {
    cleanup();
    delete window.ttq;
  });

  it('reports a registration once and clears the marker', () => {
    document.cookie = `${NEW_OAUTH_USER_COOKIE}=1; path=/`;

    render(<OAuthRegistrationTracker />);
    render(<OAuthRegistrationTracker />);

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(
      'CompleteRegistration',
      {},
      { event_id: expect.any(String) }
    );
    expect(document.cookie).not.toContain(NEW_OAUTH_USER_COOKIE);
  });

  it('reports nothing for an existing account', () => {
    render(<OAuthRegistrationTracker />);

    expect(track).not.toHaveBeenCalled();
  });
});
