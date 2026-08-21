import { makeClientId } from './id';

export const SOCIAL_LINK_SUGGESTIONS = ['GitHub', 'LinkedIn', 'Portfolio', 'Website'] as const;

export const makeSocialLinkId = (): string => makeClientId();
