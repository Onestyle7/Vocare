import { getArticlesMetadata } from '@/app/blog/_utils/blogUtils';
import { ARTICLES_FOLDER } from '@/app/blog/_utils/constants';

try {
  console.log('Checking markdown articles...');
  getArticlesMetadata(ARTICLES_FOLDER);
  console.log('All articles validated succesfully');
  process.exit(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  console.error('Frontmatter validation error');
  process.exit(1);
}
