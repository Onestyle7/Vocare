'use client';


import { motion, useInView } from 'framer-motion';
import { useMemo, useRef, useState, useEffect } from 'react';


interface AnimatedTextProps {
  lines: string[];
  className?: string;
}


const AnimatedHeadline = ({ lines, className }: AnimatedTextProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-10% 0px' }); 
  const [uniqueKey, setUniqueKey] = useState(0); 


  useEffect(() => {
    if (isInView) {
      setUniqueKey(Date.now());
    }
  }, [isInView]);


  const randomizedDelays = useMemo(() => {
    return lines.map((line) => line.split('').map(() => Math.random() * 0.8));
  }, [uniqueKey]); 

  return (
    <div ref={ref} className={`flex flex-col ${className}`}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="flex overflow-hidden">
          {line.split('').map((char, i) => (
            <motion.span
              key={`${lineIndex}-${i}-${uniqueKey}`} 
              className="2xl:-mt-2 mt-1 2xl:mb-3 inline-block whitespace-pre"
              initial={{ y: 50, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: {
                  delay: randomizedDelays[lineIndex][i],
                  duration: 0.2,
                  ease: 'easeOut',
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      ))}
    </div>
  );
};


export default AnimatedHeadline;
