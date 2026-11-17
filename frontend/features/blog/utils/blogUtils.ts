import fs from 'fs';
import matter from 'gray-matter';
import { imageSize } from 'image-size';
import { env } from 'process';
import { cache } from 'react';
import { ZodError } from 'zod';

import { ArticleMetadata, articleSchema, ImageProps } from '../types';

/** Getting absolute image url from relative 'public' folder image path */
export function toAbsoluteUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = (env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
  return `${baseUrl}${normalizedPath}`;
}

/** Average adult reading speed in Polish, in words per minute. */
const WORDS_PER_MINUTE = 200;

/**
 * Reading time in whole minutes, derived from the article body.
 *
 * The `estimatedReadTime` frontmatter field was hand-written and wrong on 110
 * of 123 posts (it clustered on 7-9 minutes while the bodies average ~760
 * words, i.e. ~4 minutes), always overstating, never understating. The field
 * is kept in the schema for backwards compatibility but the displayed value is
 * computed here so it cannot drift from the content again.
 */
export function calculateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Get article content based on article slug and source folder name */
export const getArticleContent = cache((slug: string, baseFolder: string) => {
  try {
    const article_path = baseFolder + `${slug}.md`;
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(article_path, 'utf-8');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'ENOENT'
      ) {
        return null;
      }
      throw err;
    }
    const matter_result = matter(fileContent);
    const metadata = articleSchema.parse(matter_result.data);

    return {
      ...matter_result,
      data: {
        ...metadata,
        estimatedReadTime: calculateReadTime(matter_result.content),
      },
    };
  } catch (error) {
    console.log(`Error occured when getting content of: ${slug} article`);
    throw error;
  }
});

/** Parse frontmatter article.md metadata */
export function getArticlesMetadata(basePath: string): ArticleMetadata[] {
  const regex = /^(_depreceated-)?([a-z0-9]+-)*[a-z0-9]+\.md$/;
  const files = fs.readdirSync(basePath);
  const markdownFiles = files.filter((file) => file.endsWith('.md') && !file.startsWith('_'));

  const posts = markdownFiles.map((filename) => {
    try {
      if (!regex.test(filename))
        throw new Error(`${filename}: Invalid filename can't be parsed as slug`);

      const fileContent = fs.readFileSync(`${basePath}${filename}`, 'utf-8');
      const { data, content } = matter(fileContent);
      const matterResult = articleSchema.parse(data);

      return {
        ...matterResult,
        estimatedReadTime: calculateReadTime(content),
        slug: filename.replace('.md', ''),
      };
    } catch (error) {
      console.log('\n');
      if (error instanceof ZodError) {
        console.log(`Ivalid article metadata in ${filename}:`);
        console.log(error.errors);
      }
      console.log('\n');
      throw error;
    }
  });

  return posts;
}

/**
 * Parse image sizes from '.md' title prop
 * @example
 * ![Alt text](/images/blog/my-image.webp 'width=800 height=450')
 */
export function getImageSizeFromTitle(props: ImageProps) {
  const title = props.title?.trim();
  if (!title) return null;

  const pattern: RegExp = /^w(?:idth)?\s*[:=]\s*(\d+)\s+h(?:eight)?\s*[:=]\s*(\d+)$/i; // width=1200 height=675
  const match = title.match(pattern);
  if (!match)
    throw new Error(
      'You have to include both "width=" and "height=" in markdown image title, and they have to be a number'
    );

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

/**
 * Real pixel size of an image from the `public` folder, for og:image width/height.
 * Returns undefined when the file cannot be read, so metadata simply omits the size.
 */
export function getPublicImageSize(
  publicPath: string
): { width: number; height: number } | undefined {
  try {
    const { width, height } = imageSize(fs.readFileSync(`public${publicPath}`));
    return { width, height };
  } catch {
    return undefined;
  }
}

/** Words too common in Polish tags to say anything about a shared topic. */
const TAG_STOP_WORDS = new Set(['w', 'i', 'z', 'do', 'na', 'po', 'dla', 'jak', 'co', 'czy', 'o']);

const getTagTokens = (tags: string[]) =>
  new Set(
    tags
      .flatMap((tag) => tag.toLowerCase().split(/\s+/))
      .filter((token) => token.length > 1 && !TAG_STOP_WORDS.has(token))
  );

/**
 * Articles to suggest under a post, most related first.
 *
 * Tags are free-form phrases that rarely repeat verbatim between posts, so
 * relatedness is scored on the words they share. Each shared word counts for
 * more the rarer it is across the blog: "cv" appears in every CV post and says
 * little, "wzór" appears in a few and says a lot. The same category adds a
 * small bonus and ties go to the newer post. Posts sharing nothing with the
 * current one are left out instead of padding the list with unrelated links.
 */
export function getRelatedArticles(
  current: Pick<ArticleMetadata, 'slug' | 'category' | 'tags'>,
  articles: ArticleMetadata[],
  limit = 3
): ArticleMetadata[] {
  const SAME_CATEGORY_BONUS = 1;
  const currentTokens = getTagTokens(current.tags);
  const tokensBySlug = new Map(
    articles.map((article) => [article.slug, getTagTokens(article.tags)])
  );

  const articlesWithToken = new Map<string, number>();
  for (const tokens of tokensBySlug.values()) {
    for (const token of tokens) {
      articlesWithToken.set(token, (articlesWithToken.get(token) ?? 0) + 1);
    }
  }
  const rarity = (token: string) =>
    Math.log((articles.length + 1) / (articlesWithToken.get(token) ?? 1));

  return articles
    .filter((article) => article.slug !== current.slug)
    .map((article) => {
      const sharedScore = [...(tokensBySlug.get(article.slug) ?? [])]
        .filter((token) => currentTokens.has(token))
        .reduce((sum, token) => sum + rarity(token), 0);
      const score = sharedScore + (article.category === current.category ? SAME_CATEGORY_BONUS : 0);
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.article.updatedAt ?? b.article.date).getTime() -
          (a.article.updatedAt ?? a.article.date).getTime()
    )
    .slice(0, limit)
    .map(({ article }) => article);
}

/**
 * Splits an article body into the intro and everything from the first `##`
 * section on, so a block can be placed between them. The intro is empty when
 * the article opens with a section heading; `rest` is empty when it has none.
 */
export function splitArticleIntro(content: string): { intro: string; rest: string } {
  const firstSection = content.search(/^## /m);
  if (firstSection === -1) return { intro: content, rest: '' };
  return { intro: content.slice(0, firstSection), rest: content.slice(firstSection) };
}
