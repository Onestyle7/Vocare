"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutCard from "@/components/AboutCard";
import Section from "@/components/Section";
import { plus } from "@/app/constants";

gsap.registerPlugin(ScrollTrigger);

const AboutCards = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1280px)").matches) return;
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll(".about-card");

    cards.forEach((card, index) => {
      const offset = index * 60; 

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: `top+=${offset} 80%`,
          end: `+=400`,
          scrub: true,
        },
      });

      tl.fromTo(
        card,
        { autoAlpha: 0, y: 100, rotation: 0 },
        {
          autoAlpha: 1,
          y: 0,
          rotation: index % 2 === 0 ? -5 : 5,
          duration: 1,
          ease: "power2.out",
        }
      )
        .to(card, { y: -40, duration: 1.6, ease: "sine.inOut" })
        .to(card, { y: 40, duration: 1.6, ease: "sine.inOut" })
        .to(card, { y: 0, duration: 1.5, ease: "sine.inOut" })
        .to(card, {
          y: -600,
          autoAlpha: 0,
          rotation: 0,
          duration: 2,
          ease: "power1.in",
        });
    });
  }, []);

  return (
    <Section
      className="pt-[7.5rem] -mt-[2.25rem] relative"
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="about"
    >
      <div ref={containerRef} className="relative lg:w-full flex main-font-color">
        <div className="flex items-center justify-center w-full flex-col lg:flex-row lg:space-x-4 max-lg:space-y-4 mx-8">
          {[...Array(3)].map((_, i) => (
            <div className="about-card" key={i}>
              <AboutCard
                img={plus}
                title="Beginners friendly"
                description="Jump right in! Our resources cater to all skill levels, ensuring a smooth learning curve for newcomers."
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default AboutCards;
