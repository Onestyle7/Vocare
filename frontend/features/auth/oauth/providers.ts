// Kept apart from base.ts, which reads server-only settings, so client code can check a provider too
export const oAuthProviders = ['google'] as const;

export type OAuthProvider = (typeof oAuthProviders)[number];
