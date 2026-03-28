import Image from 'next/image';
import {
  BlockquoteProps,
  CodeProps,
  EmProps,
  HeadingProps,
  HeadingThreeProps,
  HeadingTwoProps,
  HrProps,
  LinkProps,
  ListItemProps,
  ListProps,
  OrderedListProps,
  ParagraphProps,
  PreProps,
  StrongProps,
  ImageProps,
} from '../_utils/types';
import { getImageSizeFromTitle } from '../_utils/blogUtils';

export function H1(props: HeadingProps) {
  return <h1 className="mt-10 mb-8 text-center text-4xl font-bold md:text-5xl" {...props} />;
}

export function H2(props: HeadingTwoProps) {
  return <h2 className="mt-10 mb-4 text-left text-2xl font-semibold md:text-3xl" {...props} />;
}

export function H3(props: HeadingThreeProps) {
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

export function Pre(props: PreProps) {
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
