'use client';
import { cn } from '@/lib/utils';
import { motion, Transition, Variants } from 'motion/react';
import React, { CSSProperties } from 'react';

type SpinningTextProps = {
  children: string | string[];
  style?: CSSProperties;
  duration?: number;
  className?: string;
  reverse?: boolean;
  fontSize?: number;
  radius?: number;
  transition?: Transition;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
};

// linear easing jako funkcja (kompatybilne z typami Motion)
const LINEAR_EASE = (t: number) => t;

const BASE_TRANSITION: Transition = {
  repeat: Infinity,
  ease: LINEAR_EASE,
};

const BASE_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

export function SpinningText({
  children,
  duration = 10,
  style,
  className,
  reverse = false,
  radius = 5,
  transition,
  variants,
}: SpinningTextProps) {
  if (typeof children !== 'string' && !Array.isArray(children)) {
    throw new Error('children must be a string or an array of strings');
  }

  const text = Array.isArray(children) ? children.join('') : children;

  if (Array.isArray(children) && !children.every((c) => typeof c === 'string')) {
    throw new Error('all elements in children array must be strings');
  }

  const letters = text.split('');
  letters.push(' ');

  const finalTransition: Transition = {
    ...BASE_TRANSITION,
    ...(transition ?? {}),
    duration: transition?.duration ?? duration,
  };

  const containerVariants: Variants = {
    visible: { rotate: reverse ? -360 : 360 },
    ...(variants?.container ?? {}),
  };

  const itemVariants: Variants = {
    ...BASE_ITEM_VARIANTS,
    ...(variants?.item ?? {}),
  };

  return (
    <motion.div
      className={cn('relative', className)}
      style={{ ...style }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={finalTransition}
    >
      {letters.map((letter, index) => (
        <motion.span
          aria-hidden="true"
          key={`${index}-${letter}`}
          variants={itemVariants}
          className="absolute top-1/2 left-1/2 inline-block xl:scale-125 2xl:scale-150"
          style={
            {
              '--index': index,
              '--total': letters.length,
              '--radius': radius,
              transform: `
                translate(-50%, -50%)
                rotate(calc(360deg / var(--total) * var(--index)))
                translateY(calc(var(--radius, 5) * -1ch))
              `,
              transformOrigin: 'center',
            } as React.CSSProperties
          }
        >
          {letter}
        </motion.span>
      ))}
      <span className="sr-only">{text}</span>
    </motion.div>
  );
}
