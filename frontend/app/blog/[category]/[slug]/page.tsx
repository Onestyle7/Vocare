import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
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
  toAbsoluteUrl,
} from '@/features/blog/utils/blogUtils';
import {
  ARTICLES_FOLDER,
  BLOG_CATEGORIES,
  isBlogCategorySlug,
} from '@/features/blog/utils/constants';

type MetadataProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({ params }: MetadataProps) {
  const { slug, category } = await params;
  const { data: metadata } = getArticleContent(slug, ARTICLES_FOLDER);
  const canonicalPath = `/blog/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;
  const articleUrl = toAbsoluteUrl(canonicalPath);
  const coverImageUrl = toAbsoluteUrl(metadata.coverImage);

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
      authors: metadata.author ? [metadata.author] : undefined,
      section: metadata.category,
      tags: metadata.tags,
      images: [
        {
          url: coverImageUrl,
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
  const { content, data: metadata } = getArticleContent(slug, ARTICLES_FOLDER);
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
    mainEntityOfPage: articleUrl,
    author: metadata.author
      ? {
          '@type': 'Person',
          name: metadata.author,
          url: toAbsoluteUrl('/blog'),
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Vocare',
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/metadata/og-image.png'),
      },
    },
    keywords: metadata.tags.join(', '),
    articleSection: metadata.category,
    inLanguage: 'pl-PL',
  };
  const categoryLabel = isBlogCategorySlug(metadata.category)
    ? BLOG_CATEGORIES[metadata.category].label
    : metadata.category;
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
      <article className="font-poppins mx-auto my-10 max-w-250">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
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
          }}
        >
          {content}
        </Markdown>
      </article>
    </PageWithBackButton>
  );
}
