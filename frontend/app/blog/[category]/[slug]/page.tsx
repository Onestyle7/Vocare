import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  UL,
} from '../../_components/MarkdownComponents';
import PageWithBackButton from '../../_components/PageWIthBackButton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getArticleContent, toAbsoluteUrl, getArticlesMetadata } from '../../_utils/blogUtils';
import { ARTICLES_FOLDER } from '../../_utils/constants';

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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: metadata.title,
    description: metadata.description,
    image: [imageUrl],
    datePublished: metadata.date.toISOString(),
    dateModified: metadata.date.toISOString(),
    mainEntityOfPage: articleUrl,
    author: metadata.author
      ? {
          '@type': 'Person',
          name: metadata.author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Vocare',
    },
    keywords: metadata.tags.join(', '),
    articleSection: metadata.category,
    inLanguage: 'pl-PL',
  };

  return (
    <PageWithBackButton backButtonHref="/blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="font-poppins space-y-2 text-center">
        <Badge className="mb-5">
          {metadata.category.charAt(0).toUpperCase() + metadata.category.replace('-', ' ').slice(1)}
        </Badge>
        <h1 className="mb-5 text-4xl font-semibold">{metadata.title}</h1>
        <p className="text-muted-foreground text-sm">
          {metadata.author && `Autor: ${metadata.author} |`} Opublikowano:{' '}
          {metadata.date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
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
            ul: UL,
          }}
        >
          {content}
        </Markdown>
      </article>
    </PageWithBackButton>
  );
}
