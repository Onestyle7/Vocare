export const SOCIAL_LINK_SUGGESTIONS = ['GitHub', 'LinkedIn', 'Portfolio', 'Website'] as const;

export const makeSocialLinkId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-social`;
