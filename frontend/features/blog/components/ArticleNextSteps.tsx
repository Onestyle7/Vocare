import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { ArticleMetadata } from '../types';
import { BlogCategorySlug, CATEGORY_TOOL_CTA } from '../utils/constants';
import ArticleCard from './ArticleCard';

/**
 * Closing block of every post: one product CTA matched to the category and
 * links to the most related posts. Before this, an article ended with nothing
 * to click, which showed up as roughly one page per visit.
 */
export default function ArticleNextSteps({
  category,
  relatedArticles,
}: {
  category: BlogCategorySlug | null;
  relatedArticles: ArticleMetadata[];
}) {
  const cta = category ? CATEGORY_TOOL_CTA[category] : null;

  if (!cta && relatedArticles.length === 0) return null;

  return (
    <aside className="font-poppins mx-auto mb-16 max-w-250 space-y-12">
      {cta && (
        <section className="bg-card border-border flex flex-col items-start gap-4 rounded-3xl border p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold md:text-2xl">{cta.heading}</h2>
            <p className="text-muted-foreground text-sm md:text-base">{cta.description}</p>
          </div>
          <Button
            asChild
            className="shrink-0 rounded-full bg-[#915EFF] px-6 text-white hover:bg-[#915EFF]/90"
          >
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </section>
      )}
      {relatedArticles.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">Czytaj dalej</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedArticles.map((article) => (
              <Link
                href={`/blog/${encodeURIComponent(article.category)}/${encodeURIComponent(article.slug)}`}
                key={article.slug}
                className="block h-full w-full"
              >
                <ArticleCard article={article} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
