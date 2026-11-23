import { getArticlesMetadata } from '@/features/blog/utils/blogUtils';
import { ARTICLES_FOLDER } from '@/features/blog/utils/constants';
import { sortForListing, toSearchItem } from '@/features/blog/utils/pagination';

// Built once at deploy time. The blog search downloads it on the first keystroke, so the listing
// pages no longer carry every post in their HTML payload.
export const dynamic = 'force-static';

export function GET() {
  const index = sortForListing(getArticlesMetadata(ARTICLES_FOLDER)).map(toSearchItem);
  return Response.json(index);
}
