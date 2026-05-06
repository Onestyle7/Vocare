import fs from 'fs';
import matter from 'gray-matter';
import { env } from 'process';
import { cache } from 'react';
import { ZodError } from 'zod';

import { ArticleMetadata, articleSchema, ImageProps } from '../types';

/** Getting absolute image url from relative 'public' folder image path */
export function toAbsoluteUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.NEXT_PUBLIC_APP_URL}${normalizedPath}`;
}

/** Get article content based on article slug and source folder name */
export const getArticleContent = cache((slug: string, baseFolder: string) => {
  try {
    const article_path = baseFolder + `${slug}.md`;
    const fileContent = fs.readFileSync(article_path, 'utf-8');
    const matter_result = matter(fileContent);
    const metadata = articleSchema.parse(matter_result.data);

    return {
      ...matter_result,
      data: metadata,
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
      const { data } = matter(fileContent);
      const matterResult = articleSchema.parse(data);

      return {
        ...matterResult,
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
