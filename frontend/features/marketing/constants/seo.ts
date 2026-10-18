// Jedno źródło danych o serwisie dla metadanych i schema.org (JSON-LD).

export const SITE_NAME = 'Vocare';

// Wymiary muszą odpowiadać plikom w public/metadata – są deklarowane w og:image i w schema.
export const OG_IMAGE = { path: '/metadata/og-image.png', width: 1200, height: 630 } as const;

// Kwadratowe logo na czarnym tle: czytelne na białym tle w wynikach Google
// (wymóg dla Organization.logo i publisher.logo, min. 112×112 px).
export const SITE_LOGO = { path: '/metadata/logo.png', width: 512, height: 512 } as const;

export const SOCIAL_PROFILE_URLS = [
  'https://www.instagram.com/vocare.pl/',
  'https://www.linkedin.com/company/vocarepl/',
  'https://www.facebook.com/profile.php?id=61583477355189',
  'https://www.tiktok.com/@vocare.pl',
] as const;
