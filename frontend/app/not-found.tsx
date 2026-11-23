import type { Metadata } from 'next';

import NotFoundView from '@/components/SupportComponents/NotFoundView';

// Server wrapper so the 404 can carry its own metadata. Without it the page inherited the
// layout's `index, follow` next to Next's own `noindex`, and the plain "Vocare" title.
export const metadata: Metadata = {
  title: 'Nie znaleziono strony',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundView />;
}
