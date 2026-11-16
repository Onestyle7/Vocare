// @vitest-environment node

import fs, { Dirent } from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArticleMetadata } from '../types';
import * as blogUtils from '../utils/blogUtils';

describe('toAbsoluteUrl', () => {
  const baseUrl = 'https://example.com';

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', baseUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return absolute URL for path with leading slash', () => {
    const path = '/blog/test-article';
    const result = blogUtils.toAbsoluteUrl(path);
    expect(result).toBe(`${baseUrl}${path}`);
  });

  it('should return absolute URL for path without leading slash', () => {
    const path = 'blog/another-test';
    const result = blogUtils.toAbsoluteUrl(path);
    expect(result).toBe(`${baseUrl}/${path}`);
  });

  it('should correctly handle root path', () => {
    const result = blogUtils.toAbsoluteUrl('/');
    expect(result).toBe(`${baseUrl}/`);
  });

  it('should correctly handle empty path (not that it should happen)', () => {
    const result = blogUtils.toAbsoluteUrl('');
    expect(result).toBe(`${baseUrl}/`);
  });
});

describe('calculateReadTime', () => {
  it('should round to the nearest minute at 200 words per minute', () => {
    expect(blogUtils.calculateReadTime('word '.repeat(400))).toBe(2);
    expect(blogUtils.calculateReadTime('word '.repeat(700))).toBe(4);
  });

  it('should never return less than a minute', () => {
    expect(blogUtils.calculateReadTime('short')).toBe(1);
    expect(blogUtils.calculateReadTime('')).toBe(1);
    expect(blogUtils.calculateReadTime('   \n  ')).toBe(1);
  });

  it('should collapse repeated whitespace instead of counting it as words', () => {
    expect(blogUtils.calculateReadTime('a\n\n  b\t\tc')).toBe(1);
    expect(blogUtils.calculateReadTime(`one two${'\n\n'}three`)).toBe(1);
  });
});

describe('Articles parsing', () => {
  const validContent = `---
title: 'Test title'
description: 'Test description'
estimatedReadTime: 5 
date: '2026-03-15'
author: Test Author
category: 'test-category'
coverImage: '/testImage.webp'
tags: ['testTag', 'testTag2']
---
# Hello World`;

  const invalidContent = `---
title: 'Test title'
description: 'Test description'
estimatedReadTime: 5 
date: '2026-03-15'
category: 'test-category'
coverImage: 'testImage.webp'
tags: ['testTag', 'testTag2']
---
# Hello World`;

  const readSpy = vi.spyOn(fs, 'readFileSync');
  const readDirSpy = vi.spyOn(fs, 'readdirSync');

  describe('getArticleContent', () => {
    it('should correctly parse a valid markdown file', () => {
      readSpy.mockReturnValue(validContent);
      const result = blogUtils.getArticleContent('test-slug', '/fake/path/');

      expect(result).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test title',
            description: 'Test description',
            // Computed from the body, not read from frontmatter: the fixture
            // claims 5 minutes but the body is two words, so it is 1.
            estimatedReadTime: 1,
            date: new Date('2026-03-15'),
            author: 'Test Author',
            category: 'test-category',
            coverImage: '/testImage.webp',
            tags: ['testTag', 'testTag2'],
          }),
          content: '# Hello World',
        })
      );

      expect(fs.readFileSync).toHaveBeenCalledWith('/fake/path/test-slug.md', 'utf-8');
    });

    it('should throw error when markdown file lacks critical metadata', () => {
      readSpy.mockReturnValue(invalidContent);

      expect(() => blogUtils.getArticleContent('test-slug', '/fake/path/')).toThrow();
    });

    it('should return null when markdown file does not exist (ENOENT)', () => {
      const enoentError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });
      readSpy.mockImplementation(() => {
        throw enoentError;
      });

      const result = blogUtils.getArticleContent('non-existent-slug', '/fake/path/');
      expect(result).toBeNull();
    });
  });

  describe('getArticlesMetadata', () => {
    const invalidArticles = [
      'firstArticle.md',
      'second-article.md',
      '_hidden-article.md',
    ] as unknown as Dirent<Buffer<ArrayBuffer>>[];
    const validArticles = [
      'first-article.md',
      'second-article.md',
      '_hidden-article.md',
    ] as unknown as Dirent<Buffer<ArrayBuffer>>[];

    it('should read metadata from articles with valid names', () => {
      readDirSpy.mockReturnValue(validArticles);
      readSpy.mockReturnValue(validContent);
      const result = blogUtils.getArticlesMetadata('/fake/path');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          slug: 'first-article',
          title: 'Test title',
          description: 'Test description',
          estimatedReadTime: 1,
          date: new Date('2026-03-15'),
          author: 'Test Author',
          category: 'test-category',
          coverImage: '/testImage.webp',
          tags: ['testTag', 'testTag2'],
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          slug: 'second-article',
          title: 'Test title',
          description: 'Test description',
          estimatedReadTime: 1,
          date: new Date('2026-03-15'),
          author: 'Test Author',
          category: 'test-category',
          coverImage: '/testImage.webp',
          tags: ['testTag', 'testTag2'],
        })
      );
    });

    it('should throw error when one of articles metadata is wrong', () => {
      readDirSpy.mockReturnValue(validArticles);
      readSpy.mockReturnValue(invalidContent);

      expect(blogUtils.getArticlesMetadata).toThrow(Error);
    });

    it('should throw error when one of articles title is wrong', () => {
      readDirSpy.mockReturnValue(invalidArticles);
      readSpy.mockReturnValue(validContent);

      expect(blogUtils.getArticlesMetadata).toThrow(Error);
    });
  });
});

describe('getRelatedArticles', () => {
  const makeArticle = (
    slug: string,
    category: string,
    tags: string[],
    date = '2026-01-01'
  ): ArticleMetadata => ({
    slug,
    category,
    tags,
    title: slug,
    description: slug,
    estimatedReadTime: 1,
    coverImage: '/images/blog/cover.webp',
    date: new Date(date),
  });

  const current = makeArticle('wzor-cv', 'cv', ['wzór cv', 'cv do pobrania']);

  it('never suggests the article itself', () => {
    const result = blogUtils.getRelatedArticles(current, [current]);
    expect(result).toEqual([]);
  });

  it('ranks shared tag words above a bare category match', () => {
    const sameCategory = makeArticle('zdjecie', 'cv', ['zdjęcie profilowe']);
    const sharedWords = makeArticle('przyklad', 'cv', ['przykładowe cv', 'wzór']);
    const result = blogUtils.getRelatedArticles(current, [sameCategory, sharedWords]);
    expect(result.map((article) => article.slug)).toEqual(['przyklad', 'zdjecie']);
  });

  it('leaves out articles that share neither category nor tag words', () => {
    const unrelated = makeArticle('urlop', 'praca', ['urlop wypoczynkowy']);
    expect(blogUtils.getRelatedArticles(current, [unrelated])).toEqual([]);
  });

  it('ignores stop words when matching tags', () => {
    const stopWordOnly = makeArticle('praca', 'praca', ['praca do zaraz']);
    expect(blogUtils.getRelatedArticles(current, [stopWordOnly])).toEqual([]);
  });

  it('breaks ties with the newer article and respects the limit', () => {
    const older = makeArticle('older', 'cv', ['inne'], '2026-01-01');
    const newer = makeArticle('newer', 'cv', ['inne'], '2026-06-01');
    const result = blogUtils.getRelatedArticles(current, [older, newer], 1);
    expect(result.map((article) => article.slug)).toEqual(['newer']);
  });
});

describe('splitArticleIntro', () => {
  it('splits before the first second-level heading', () => {
    const result = blogUtils.splitArticleIntro('Intro.\n\n## First\n\nText\n\n## Second');
    expect(result).toEqual({ intro: 'Intro.\n\n', rest: '## First\n\nText\n\n## Second' });
  });

  it('does not split on third-level headings', () => {
    const content = 'Intro.\n\n### Detail';
    expect(blogUtils.splitArticleIntro(content)).toEqual({ intro: content, rest: '' });
  });

  it('returns an empty intro when the article opens with a section', () => {
    expect(blogUtils.splitArticleIntro('## First\n\nText').intro).toBe('');
  });
});
