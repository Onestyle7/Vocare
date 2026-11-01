import Image from 'next/image';
import type { ExtraProps } from 'react-markdown';

import {
  BlockquoteProps,
  CodeProps,
  EmProps,
  HeadingProps,
  HeadingTwoProps,
  HrProps,
  ImageProps,
  LinkProps,
  ListItemProps,
  ListProps,
  OrderedListProps,
  ParagraphProps,
  PreProps,
  StrongProps,
  TableBodyProps,
  TableCellProps,
  TableHeaderCellProps,
  TableHeadProps,
  TableProps,
  TableRowProps,
} from '../types';
import { isArticleWidgetName } from '../utils/articleWidgets';
import { getImageSizeFromTitle } from '../utils/blogUtils';
import ArticleWidget from './ArticleWidget';

export function H1(props: HeadingProps) {
  return <h1 className="mt-10 mb-8 text-center text-4xl font-bold md:text-5xl" {...props} />;
}

export function H2(props: HeadingTwoProps) {
  return <h2 className="mt-10 mb-4 text-left text-2xl font-semibold md:text-3xl" {...props} />;
}

export function H3(props: HeadingProps) {
  return <h3 className="mt-8 mb-3 text-left text-xl font-semibold md:text-2xl" {...props} />;
}

export function P(props: ParagraphProps) {
  return <p className="text-foreground/90 mt-3 text-base" {...props} />;
}

export function UL(props: ListProps) {
  return <ul className="my-3 list-disc space-y-2 pl-6" {...props} />;
}

export function OL(props: OrderedListProps) {
  return <ol className="my-3 list-decimal space-y-3 pl-6" {...props} />;
}

export function LI(props: ListItemProps) {
  return <li className="text-foreground/90 leading-7" {...props} />;
}

export function A(props: LinkProps) {
  return (
    <a
      className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
      {...props}
    />
  );
}

export function Img(props: ImageProps) {
  if (!props.src || typeof props.src !== 'string') {
    return null;
  }

  const sizes = getImageSizeFromTitle(props);

  return (
    <Image
      src={props.src}
      alt={props.alt ?? 'Article image'}
      width={sizes?.width ?? 640}
      height={sizes?.height ?? 360}
      className="mx-auto my-8 rounded-2xl border object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 768px"
    />
  );
}

export function Blockquote(props: BlockquoteProps) {
  return (
    <blockquote
      className="text-foreground/80 border-primary/50 my-6 border-l-4 bg-[rgba(146,150,253,1)]/20 py-3 pl-4 italic [&>p]:m-0"
      {...props}
    />
  );
}

export function Code(props: CodeProps) {
  return <code className="bg-muted rounded px-1.5 py-0.5 text-sm" {...props} />;
}

function getArticleWidgetName(node: ExtraProps['node']) {
  const code = node?.children[0];
  if (code?.type !== 'element' || code.tagName !== 'code') return null;

  const classNames = code.properties.className;
  if (!Array.isArray(classNames) || !classNames.includes('language-vocare-widget')) return null;

  const text = code.children[0];
  const name = text?.type === 'text' ? text.value.trim() : '';
  return isArticleWidgetName(name) ? name : null;
}

export function Pre({ node, ...props }: PreProps & ExtraProps) {
  const widgetName = getArticleWidgetName(node);
  if (widgetName) {
    return (
      <div className="my-8">
        <ArticleWidget name={widgetName} />
      </div>
    );
  }

  return <pre className="bg-muted/60 my-6 overflow-x-auto rounded-xl p-4 text-sm" {...props} />;
}

export function HR(props: HrProps) {
  return <hr className="border-border/60 my-6" {...props} />;
}

export function Strong(props: StrongProps) {
  return <strong className="text-foreground font-semibold" {...props} />;
}

export function Em(props: EmProps) {
  return <em className="text-foreground/80 italic" {...props} />;
}

export function Table(props: TableProps) {
  return (
    <div className="border-border/60 my-6 overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  );
}

export function THead(props: TableHeadProps) {
  return <thead className="bg-muted" {...props} />;
}

export function TBody(props: TableBodyProps) {
  return <tbody className="divide-border/60 divide-y" {...props} />;
}

export function TR(props: TableRowProps) {
  return <tr className="even:bg-muted/40" {...props} />;
}

export function TH(props: TableHeaderCellProps) {
  return (
    <th
      className="text-foreground border-border/60 border-b px-4 py-3 font-semibold whitespace-nowrap"
      {...props}
    />
  );
}

export function TD(props: TableCellProps) {
  return <td className="text-foreground/90 px-4 py-3 align-top" {...props} />;
}
