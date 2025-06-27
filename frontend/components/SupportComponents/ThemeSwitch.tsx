'use client';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useTheme } from 'next-themes';

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const divRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && theme && !initialized) {
      const darkMode = theme === 'dark';
      setIsDark(darkMode);

      if (divRef.current) {
        gsap.set(divRef.current, {
          rotation: darkMode ? 180 : 0,
        });
      }
      setInitialized(true);
    }
  }, [mounted, theme, initialized]);

  const rotateSwitch = () => {
    if (!mounted) return;

    const newIsDark = !isDark;
    const newRotation = newIsDark ? 180 : 0;
    const newTheme = newIsDark ? 'dark' : 'light';

    gsap.to(divRef.current, {
      rotation: newRotation,
      duration: 0.5,
      ease: 'power2.inOut',
    });

    setTheme(newTheme);
    setIsDark(newIsDark);
  };

  if (!mounted) {
    return (
      <button className="flex h-[30px] w-[30px] cursor-pointer overflow-hidden rounded-full border-[1px] border-gray-300">
        <div className="h-full w-1/2 bg-gray-300"></div>
        <div className="h-full w-1/2 bg-gray-300"></div>
      </button>
    );
  }

  return (
    <button
      className="flex h-[30px] w-[30px] cursor-pointer overflow-hidden rounded-full border-[1px] border-gray-800 dark:border-gray-200"
      onClick={rotateSwitch}
      ref={divRef}
    >
      <div className="h-full w-1/2 bg-black"></div>
      <div className="h-full w-1/2 bg-white"></div>
    </button>
  );
};

export default ThemeSwitch;
