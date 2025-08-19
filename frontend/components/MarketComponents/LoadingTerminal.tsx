import Image from 'next/image';
import { AnimatedSpan, Terminal, TypingAnimation } from '../magicui/terminal';
import { spinner_terminal } from '@/app/constants';

export function TerminalDemo() {
  return (
    <Terminal>
      <TypingAnimation>&gt; npm vocare init</TypingAnimation>

      <AnimatedSpan delay={1500} className="text-green-500">
        <span>✔ Initializing career advisor engine.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={2000} className="text-green-500">
        <span>✔ Analyzing user skills and experience.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={2500} className="text-green-500">
        <span>✔ Scanning current job market trends.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={3000} className="text-green-500">
        <span>✔ Matching potential career paths.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={3500} className="text-green-500">
        <span>✔ Verifying educational background.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={4000} className="text-green-500">
        <span>✔ Connecting to job role database.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={4500} className="text-green-500">
        <span>✔ Generating personalized profile.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={5000} className="text-green-500">
        <span>✔ Finding best-fit opportunities.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={5500} className="text-green-500">
        <span>✔ Compiling career recommendations.</span>
      </AnimatedSpan>

      <AnimatedSpan delay={6000} className="text-blue-500">
        <span>ℹ Updated 1 file:</span>
        <span className="pl-2">- data/user_profile.ts</span>
      </AnimatedSpan>

      <TypingAnimation delay={6500} className="text-muted-foreground">
        Success! Career analysis completed.
      </TypingAnimation>

      <div className="text-muted-foreground flex flex-row items-center space-x-2">
        <AnimatedSpan delay={7000}>
          <Image
            src={spinner_terminal}
            alt="spinner"
            width={16}
            height={16}
            className="animate-spin"
          />
        </AnimatedSpan>
        <TypingAnimation delay={7000}>
          Your personalized career paths are almost ready...
        </TypingAnimation>
      </div>
    </Terminal>
  );
}
