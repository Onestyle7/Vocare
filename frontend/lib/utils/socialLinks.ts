export const SOCIAL_LINK_TYPES = [
  'GitHub',
  'LinkedIn',
  'Portfolio',
  'Website',
  'Other',
] as const;

export type SocialLinkType = (typeof SOCIAL_LINK_TYPES)[number];

export const makeSocialLinkId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-social`;
