'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const isMoving = useRef(false);
  const [showArrow, setShowArrow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024); 
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current && followerRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;

        isMoving.current =
          Math.abs(e.clientX - lastPosition.current.x) > 1 ||
          Math.abs(e.clientY - lastPosition.current.y) > 1;
        lastPosition.current = { x: e.clientX, y: e.clientY };

        const targetX = e.clientX + 20;
        const targetY = e.clientY;

        const followerX = parseFloat(followerRef.current.style.left || '0');
        const followerY = parseFloat(followerRef.current.style.top || '0');

        const dx = targetX - followerX;
        const dy = targetY - followerY;
        const newX = followerX + dx * 0.1;
        const newY = followerY + dy * 0.1;

        followerRef.current.style.left = `${newX}px`;
        followerRef.current.style.top = `${newY}px`;

        const target = e.target as HTMLElement;
        if ((target as HTMLElement).closest('button, a')) {
          followerRef.current.style.transform = 'translate(-50%, -50%) scale(1.5)';
          cursorRef.current.style.opacity = '0';
          if (!showArrow) setShowArrow(true);
        } else {
          followerRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
          cursorRef.current.style.opacity = '1';
          if (showArrow) setShowArrow(false);
        }
      }
    };

    const checkMovement = () => {
      if (cursorRef.current && followerRef.current && !isMoving.current) {
        const cursorX = parseFloat(cursorRef.current.style.left);
        const cursorY = parseFloat(cursorRef.current.style.top);
        const targetX = cursorX + 20;
        const targetY = cursorY;
        const followerX = parseFloat(followerRef.current.style.left || '0');
        const followerY = parseFloat(followerRef.current.style.top || '0');
        const dx = targetX - followerX;
        const dy = targetY - followerY;
        const newX = followerX + dx * 0.2;
        const newY = followerY + dy * 0.2;
        followerRef.current.style.left = `${newX}px`;
        followerRef.current.style.top = `${newY}px`;
      }
    };

    document.addEventListener('mousemove', moveCursor);
    const intervalId = setInterval(checkMovement, 16);

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      clearInterval(intervalId);
    };
  }, [showArrow, isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className={twMerge(
          'pointer-events-none fixed z-50 h-2 w-2 rounded-full bg-black dark:bg-white',
          '-translate-x-1/2 -translate-y-1/2 transform transition-opacity duration-200'
        )}
      />

      <div
        ref={followerRef}
        className={twMerge(
          'pointer-events-none fixed z-50 h-8 w-8 rounded-full border-1 border-black dark:border-white',
          'transform transition-transform duration-200',
          'flex items-center justify-center antialiased'
        )}
      >
        <Image
          src="svg/arrow.svg"
          alt="Arrow"
          width={4}
          height={4}
          className={twMerge(
            'h-4 w-4 transition-opacity duration-200 dark:invert',
            showArrow ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </>
  );
};

export default CustomCursor;
