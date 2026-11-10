import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import ArticleNextSteps from '@/features/blog/components/ArticleNextSteps';
import {
  A,
  Blockquote,
  Code,
  H1,
  H2,
  H3,
  HR,
  Img,
  LI,
  OL,
  P,
  Pre,
  Strong,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  UL,
} from '@/features/blog/components/MarkdownComponents';
import PageWithBackButton from '@/features/blog/components/PageWIthBackButton';
import {
  getArticleContent,
  getArticlesMetadata,
  getPublicImageSize,
  getRelatedArticles,
  splitArticleIntro,
  toAbsoluteUrl,
} from '@/features/blog/utils/blogUtils';
import {
  ARTICLES_FOLDER,
  BLOG_CATEGORIES,
  isBlogCategorySlug,
} from '@/features/blog/utils/constants';
import { PromoInline, PromoSidebar } from '@/features/marketing/components/PromoSticky';
import { getPromoVariantForCategory } from '@/features/marketing/constants/promo';
import { SITE_LOGO } from '@/features/marketing/constants/seo';

const markdownComponents = {
  a: A,
  blockquote: Blockquote,
  code: Code,
  h1: H1,
  h2: H2,
  h3: H3,
  hr: HR,
  img: Img,
  li: LI,
  ol: OL,
  p: P,
  pre: Pre,
  strong: Strong,
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: TR,
  th: TH,
  td: TD,
  ul: UL,
};

type MetadataProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const dynamicParams = false;

const getCategoryLabel = (category: string) =>
  isBlogCategorySlug(category) ? BLOG_CATEGORIES[category].label : category;

export async function generateMetadata({ params }: MetadataProps) {
  const { slug, category } = await params;
  const article = getArticleContent(slug, ARTICLES_FOLDER);
  if (!article || article.data.category !== category) {
    return {
      title: 'Nie znaleziono artykułu',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  const { data: metadata } = article;
  const canonicalPath = `/blog/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;
  const articleUrl = toAbsoluteUrl(canonicalPath);
  const coverImageUrl = toAbsoluteUrl(metadata.coverImage);
  const coverImageSize = getPublicImageSize(metadata.coverImage);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'article',
      title: metadata.title,
      description: metadata.description,
      url: articleUrl,
      siteName: 'Vocare',
      locale: 'pl_PL',
      publishedTime: metadata.date.toISOString(),
      modifiedTime: (metadata.updatedAt ?? metadata.date).toISOString(),
      authors: metadata.author ? [metadata.author] : undefined,
      section: getCategoryLabel(metadata.category),
      tags: metadata.tags,
      images: [
        {
          url: coverImageUrl,
          ...coverImageSize,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [coverImageUrl],
    },
  } satisfies Metadata;
}

export async function generateStaticParams() {
  const articles = getArticlesMetadata(ARTICLES_FOLDER);
  return articles.map((article) => ({ category: article.category, slug: article.slug }));
}

export default async function BlogPage(props: MetadataProps) {
  const { slug, category } = await props.params;
  const article = getArticleContent(slug, ARTICLES_FOLDER);
  if (!article || article.data.category !== category) {
    notFound();
  }
  const { content, data: metadata } = article;
  const canonicalPath = `/blog/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;
  const articleUrl = toAbsoluteUrl(canonicalPath);
  const imageUrl = toAbsoluteUrl(metadata.coverImage);
  const lastModified = metadata.updatedAt ?? metadata.date;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: metadata.title,
    description: metadata.description,
    image: [imageUrl],
    datePublished: metadata.date.toISOString(),
    dateModified: lastModified.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    // `author` is an Organization, not a Person. Every post is credited to
    // "Vocare", which is a company: emitting it as a Person with /blog as its
    // profile URL claimed a human author that does not exist. schema.org
    // allows an Organization here, so this states what is actually true.
    // Swap to Person only once posts are credited to named people with real
    // credentials - see the E-E-A-T task.
    author: {
      '@type': 'Organization',
      name: metadata.author ?? 'Vocare',
      url: toAbsoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vocare',
      url: toAbsoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(SITE_LOGO.path),
        width: SITE_LOGO.width,
        height: SITE_LOGO.height,
      },
    },
    keywords: metadata.tags.join(', '),
    articleSection: getCategoryLabel(metadata.category),
    inLanguage: 'pl-PL',
  };
  const categoryLabel = getCategoryLabel(metadata.category);
  const relatedArticles = getRelatedArticles(
    { slug, category: metadata.category, tags: metadata.tags },
    getArticlesMetadata(ARTICLES_FOLDER)
  );
  const promoVariant = getPromoVariantForCategory(metadata.category);
  const { intro, rest } = splitArticleIntro(content);
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: toAbsoluteUrl('/blog') },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryLabel,
        item: toAbsoluteUrl(`/blog/${encodeURIComponent(metadata.category)}`),
      },
      { '@type': 'ListItem', position: 3, name: metadata.title, item: articleUrl },
    ],
  };

  return (
    <PageWithBackButton backButtonHref="/blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <section className="font-poppins space-y-2 text-center">
        <Link href={`/blog/${encodeURIComponent(metadata.category)}`}>
          <Badge className="mb-5">{categoryLabel}</Badge>
        </Link>
        <h1 className="mb-5 text-4xl font-semibold">{metadata.title}</h1>
        <p className="text-muted-foreground text-sm">
          {metadata.author && `Autor: ${metadata.author} |`} Opublikowano:{' '}
          {metadata.date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {metadata.updatedAt &&
            metadata.updatedAt.getTime() !== metadata.date.getTime() &&
            ` | Zaktualizowano: ${metadata.updatedAt.toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`}
        </p>
        <p className="text-muted-foreground text-xs"></p>
        <p className="text-muted-foreground text-xs">{metadata.estimatedReadTime} min. czytania</p>
        <div className="relative mx-auto mt-8 aspect-5/3 w-full max-w-3xl overflow-hidden rounded-3xl">
          <Image
            src={metadata.coverImage}
            alt={metadata.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 768px"
          />
        </div>
      </section>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10">
        <article className="font-poppins mx-auto my-10 w-full max-w-250 xl:mx-0">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {intro}
          </Markdown>
          {/* Small screens get the promo here, in the flow of the article, instead
              of a bar fixed over the text. From xl up the sidebar takes over. */}
          <PromoInline variant={promoVariant} className="my-8 xl:hidden" />
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {rest}
          </Markdown>
        </article>
        <PromoSidebar variant={promoVariant} className="my-10 hidden xl:block" />
      </div>
      <ArticleNextSteps
        category={isBlogCategorySlug(metadata.category) ? metadata.category : null}
        relatedArticles={relatedArticles}
      />
    </PageWithBackButton>
  );
}
