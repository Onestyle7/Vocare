# Blog Content Guide

Articles are stored as `.md` files in `frontend/articles/`.
File title is taken as a `slug` - so make sure the title is descriptive and not too long, also separated by hyphens.
Files that starts with `_` will be ignored. So you can "hide" unused / test articles without deleting them.

## 1. Metadata Schema (Frontmatter)

Each article must start with a YAML frontmatter block. The schema is validated using Zod.

```yaml
---
title: 'Article Title'
description: 'Short summary for the card'
estimatedReadTime: 5
date: '2024-03-15'
author: 'Your Name'
category: 'Tech'
coverImage: '/images/blog/cover.webp'
tags: ['nextjs', 'react']
---
```

| Field               | Type     | Description                                     |
| :------------------ | :------- | :---------------------------------------------- |
| `title`             | string   | Displayed as H1 and in browser tab.             |
| `description`       | string   | Shown on the blog list cards.                   |
| `estimatedReadTime` | number   | Integer (minutes).                              |
| `date`              | date     | ISO string or YYYY-MM-DD.                       |
| `author`            | string   | (Optional) Author name.                         |
| `category`          | string   | Used for routing and filtering.                 |
| `coverImage`        | string   | Path from `/public` (e.g., `/images/blog/...`). |
| `tags`              | string[] | Array of strings for search/filtering.          |

## 2. Images

Images should be placed in `frontend/public/images/blog/`.

### Cover Image

Specified in the metadata as `coverImage`. It is automatically optimized and displayed at the top of the article.

### Inline Images

To use Next.js image optimization for inline markdown images, you **must** provide dimensions in the title attribute:

```markdown
![Alt text](/images/blog/my-image.webp 'width=800 height=450')
```

**Note:** If dimensions are missing or formatted incorrectly, the image may fail to render or throw an error.

## 3. Formatting

- Use standard Markdown (H2, H3, lists, bold, etc.).
- GFM (GitHub Flavored Markdown - tables, task lists) is supported (kinda - so don't use it if you don't have to)
- Custom components are mapped for `blockquote`, `code`, `pre`, and `hr` to match the Vocare design system.
