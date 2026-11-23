import { ComponentPropsWithoutRef } from 'react';
import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedReadTime: z.number().int().positive(),
  category: z
    .string()
    .min(1)
    .refine((cat) => !cat.includes(' '), 'Category metadata cannot contain spaces.'),
  author: z.string().optional(),
  coverImage: z.string().startsWith('/'),
  date: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string()),
  // Declarative slug mirroring the filename. The app still derives the
  // canonical slug from the filename (see blogUtils.ts) - this field exists
  // so external tooling (SEO/content analyzers) that read frontmatter
  // directly can see the URL without inferring it from the file path.
  slug: z.string().optional(),
  // Overrides the promo picked by category. Without it every post in `praca` showed the CV offer,
  // including the ones about pay and contracts. Values match PromoVariant in marketing/constants/promo.
  promo: z.enum(['cv', 'career', 'market', 'salary']).optional(),
});

export type ArticleMetadata = z.infer<typeof articleSchema> & { slug: string };

export type ParagraphProps = ComponentPropsWithoutRef<'p'>;
export type ListProps = ComponentPropsWithoutRef<'ul'>;
export type OrderedListProps = ComponentPropsWithoutRef<'ol'>;
export type HeadingProps = ComponentPropsWithoutRef<'h1'>;
export type ListItemProps = ComponentPropsWithoutRef<'li'>;
export type LinkProps = ComponentPropsWithoutRef<'a'>;
export type ImageProps = ComponentPropsWithoutRef<'img'>;
export type BlockquoteProps = ComponentPropsWithoutRef<'blockquote'>;
export type CodeProps = ComponentPropsWithoutRef<'code'>;
export type PreProps = ComponentPropsWithoutRef<'pre'>;
export type HrProps = ComponentPropsWithoutRef<'hr'>;
export type StrongProps = ComponentPropsWithoutRef<'strong'>;
export type EmProps = ComponentPropsWithoutRef<'em'>;
export type HeadingTwoProps = ComponentPropsWithoutRef<'h2'>;
export type TableProps = ComponentPropsWithoutRef<'table'>;
export type TableHeadProps = ComponentPropsWithoutRef<'thead'>;
export type TableBodyProps = ComponentPropsWithoutRef<'tbody'>;
export type TableRowProps = ComponentPropsWithoutRef<'tr'>;
export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'>;
export type TableCellProps = ComponentPropsWithoutRef<'td'>;
