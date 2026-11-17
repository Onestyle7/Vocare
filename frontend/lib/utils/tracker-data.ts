/**
 * What GA4 and the TikTok and Meta pixels keep in the browser once consent is given, as seen in
 * Chromium on vocare's own pages (2026-11-12). Withdrawing consent stops the sending; these
 * functions also remove the identifiers already stored, so a later visit can't be linked to them.
 *
 * TikTok also sets `_ttp` on its own domain (.tiktok.com). A site can't delete another domain's
 * cookies, so that one stays until the visitor clears it in the browser.
 */
const ANALYTICS_COOKIES = [/^_ga$/, /^_ga_/];
// ttcsid is TikTok's session cookie; not seen locally, but removed in case it appears
const AD_COOKIES = [/^_fbp$/, /^_fbc$/, /^_ttp$/, /^_tt_enable_cookie$/, /^ttclid$/, /^ttcsid/];
// The pixels' click IDs and last external referrer
const AD_LOCAL_STORAGE = [/^multiFbc$/, /^lastExternalReferrer/];
// TikTok's session data
const AD_SESSION_STORAGE = [/^tt_/];

/**
 * Our own short-lived helper that carries a sign-up to the tools across the OAuth redirect. It
 * serves only the measurement, so it may be stored only while the visitor accepts at least one tool.
 * Set by the OAuth callback for a newly created account, read and removed by OAuthRegistrationTracker.
 */
export const NEW_OAUTH_USER_COOKIE = 'new_oauth_user';

/**
 * The cookie's own host and every parent domain below the top-level one: GA4 and the pixels write
 * their cookies on the widest domain they can (e.g. .vocare.pl), and a cookie is deleted only with
 * the same domain attribute it was set with.
 */
export function getCookieDomains(hostname: string): (string | undefined)[] {
  const labels = hostname.split('.');
  const parents = labels.slice(0, -1).map((_, i) => labels.slice(i).join('.'));
  return [undefined, ...parents];
}

function deleteMatchingCookies(patterns: RegExp[]): void {
  const names = document.cookie
    .split(';')
    .map((entry) => entry.split('=')[0].trim())
    .filter((name) => name && patterns.some((pattern) => pattern.test(name)));

  for (const name of names) {
    for (const domain of getCookieDomains(window.location.hostname)) {
      document.cookie = `${name}=; max-age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

function deleteMatchingKeys(getStorage: () => Storage, patterns: RegExp[]): void {
  try {
    const storage = getStorage();
    const keys = Object.keys(storage).filter((key) => patterns.some((p) => p.test(key)));
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage blocked by the browser – nothing could have been stored there either
  }
}

/** Removes Google Analytics identifiers from this browser. */
export function clearAnalyticsData(): void {
  deleteMatchingCookies(ANALYTICS_COOKIES);
}

/** Removes the TikTok and Meta pixels' identifiers from this browser. */
export function clearAdsData(): void {
  deleteMatchingCookies(AD_COOKIES);
  deleteMatchingKeys(() => window.localStorage, AD_LOCAL_STORAGE);
  deleteMatchingKeys(() => window.sessionStorage, AD_SESSION_STORAGE);
}

/** Removes our measurement helper, for when no tool it could serve is accepted any more. */
export function clearTrackingHelpers(): void {
  deleteMatchingCookies([new RegExp(`^${NEW_OAUTH_USER_COOKIE}$`)]);
}
