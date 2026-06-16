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
  tags: z.array(z.string()),
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
