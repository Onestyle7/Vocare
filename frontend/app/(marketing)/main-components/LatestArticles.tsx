import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { getArticlesMetadata } from '@/features/blog/utils/blogUtils';
import {
  ARTICLES_FOLDER,
  BLOG_CATEGORIES,
  isBlogCategorySlug,
} from '@/features/blog/utils/constants';

const ARTICLES_SHOWN = 3;

/**
 * Three newest posts on the homepage. The homepage is the most linked page of
 * the site and used to pass none of that on to the blog, where the content
 * that ranks lives.
 */
export default function LatestArticles() {
  const articles = getArticlesMetadata(ARTICLES_FOLDER)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, ARTICLES_SHOWN);

  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="home-blog-title"
      className="font-poppins bg-[#0F1013] px-3 pt-6 pb-12 sm:px-5 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20"
    >
      <div className="mx-auto w-full max-w-7xl px-1 sm:px-3">
        <div className="flex flex-col items-center gap-5 text-center sm:gap-6">
          <h2
            id="home-blog-title"
            className="w-full text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]"
          >
            <span className="opacity-[0.79]">Najnowsze </span>
            <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
              z bloga
            </span>
          </h2>
          <p className="text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px]">
            Poradniki o CV, karierze i rynku pracy.
          </p>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 md:grid-cols-3 lg:gap-6">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/blog/${encodeURIComponent(article.category)}/${encodeURIComponent(article.slug)}`}
                className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#16171B] transition-colors hover:border-[#9D9BFF]/60 focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={article.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5 text-[#F1F4FF]">
                  <p className="text-xs font-medium tracking-wide text-[#9D9BFF] uppercase">
                    {isBlogCategorySlug(article.category)
                      ? BLOG_CATEGORIES[article.category].label
                      : article.category}
                  </p>
                  <h3 className="text-[17px] leading-snug font-medium">{article.title}</h3>
                  <p className="line-clamp-2 text-sm font-light opacity-60">
                    {article.description}
                  </p>
                  <p className="mt-auto pt-2 text-xs font-light opacity-50">
                    {article.estimatedReadTime} min czytania
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            href="/blog"
            className="flex items-center gap-1 rounded-[14px] border border-white/20 px-6 py-3 text-sm font-medium text-[#F1F4FF] transition-colors hover:border-white/50 focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none"
          >
            Wszystkie artykuły
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
