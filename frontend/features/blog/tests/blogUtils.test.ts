import fs, { Dirent } from 'fs';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import * as blogUtils from '../_utils/blogUtils';

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
            estimatedReadTime: 5,
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
          estimatedReadTime: 5,
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
          estimatedReadTime: 5,
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
