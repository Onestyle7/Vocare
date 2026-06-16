import { gsap } from 'gsap';
import { RefObject, useEffect, useState } from 'react';

export const useCollapse = (
  contentWrapperRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  initialState: boolean = true
) => {
  const [isCollapsed, setIsCollapsed] = useState(initialState);

  useEffect(() => {
    if (contentRef?.current && contentWrapperRef?.current) {
      if (!isCollapsed) {
        gsap.set(contentWrapperRef.current, { height: 'auto' });
        const height = contentWrapperRef.current.offsetHeight;
        gsap.set(contentWrapperRef.current, { height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed]);

  const toggleCollapse = () => {
    if (contentRef?.current && contentWrapperRef?.current) {
      if (isCollapsed) {
        gsap.set(contentWrapperRef.current, { height: 'auto', visibility: 'visible' });
        const height = contentWrapperRef.current.offsetHeight;
        gsap.fromTo(
          contentWrapperRef.current,
          { height: 0, opacity: 0 },
          {
            height,
            opacity: 1,
            duration: 0.5,
            ease: 'power4.out',
            onComplete: () => {
              if (contentWrapperRef.current)
                gsap.set(contentWrapperRef.current, { height: 'auto' });
            },
          }
        );
      } else {
        const height = contentWrapperRef.current.offsetHeight;
        gsap.fromTo(
          contentWrapperRef.current,
          { height, opacity: 1 },
          {
            height: 0,
            opacity: 0,
            duration: 0.5,
            ease: 'power4.in',
            onComplete: () => {
              if (contentWrapperRef.current)
                gsap.set(contentWrapperRef.current, { visibility: 'hidden' });
            },
          }
        );
      }

      setIsCollapsed(!isCollapsed);
    }
  };

  return {
    isCollapsed,
    toggleCollapse,
  };
};
