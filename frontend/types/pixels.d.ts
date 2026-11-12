// Globals created by the inline scripts from lib/utils/tiktok-pixel.ts and lib/utils/meta-pixel.ts
interface Window {
  ttq?: {
    grantConsent: () => void;
    revokeConsent: () => void;
    track: (
      event: string,
      params?: Record<string, unknown>,
      options?: { event_id: string }
    ) => void;
  };
  loadTikTokPixel?: () => void;
  fbq?: (...args: unknown[]) => void;
  loadMetaPixel?: () => void;
}
