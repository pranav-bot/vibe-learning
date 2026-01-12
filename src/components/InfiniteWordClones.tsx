"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import CanvasFlair from "./CanvasFlair";
import FlairTrail from "./FlairTrail";

interface InfiniteWordClonesProps {
  text?: string;
  /** Optional tailwind text size classes to override defaults (e.g. "text-2xl md:text-4xl") */
  textClass?: string;
}

export function InfiniteWordClones({ text, textClass }: InfiniteWordClonesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !wordRef.current) return;

    const container = containerRef.current;
    const word = wordRef.current;
    
    const nClones = 12;
    const timelines: gsap.core.Timeline[] = [];
    const clones: HTMLElement[] = [];

    // Hide the original word but keep it for layout/measurement if needed
    // or just let it sit in the center on top
    
    for (let i = 0; i < nClones; i++) {
      const clone1 = word.cloneNode(true) as HTMLElement;
      const clone2 = word.cloneNode(true) as HTMLElement;

      // Add positioning classes for clones
      const baseClass = word.className.replace("z-10", "z-0"); // lowering z-index for clones
      const cloneClass = `${baseClass} absolute opacity-50 select-none pointer-events-none`;
      
      clone1.className = cloneClass;
      clone2.className = cloneClass;

      // Ensure container has relative positioning so clones position relative to it
      container.prepend(clone1);
      container.prepend(clone2);
      clones.push(clone1, clone2);

      const tl = gsap.timeline({
        repeat: -1,
      });

      // Animate spread
      tl.fromTo(
        [clone1, clone2],
        {
          y: 0,
          scaleY: 1,
          opacity: 0.1,
        },
        {
          duration: 3,
          y: (index) => (index === 0 ? -250 : 250), // One goes up, one goes down
          scaleY: 1.5,
          opacity: 0,
          ease: "power2.inOut",
        }
      ).progress((i / nClones)); // Stagger start positions

      timelines.push(tl);
    }

    return () => {
      timelines.forEach((tl) => tl.kill());
      clones.forEach((clone) => clone.remove());
    };
  }, []);

  return (
    
    <div 
      ref={containerRef} 
      className="relative flex h-[600px] w-full items-center justify-center overflow-visible bg-background"
    >
              {/* 🔥 BACKGROUND CANVAS */}
      <div className="absolute inset-0 z-0">
        <FlairTrail />
      </div>
        
      <div
        ref={wordRef}
        className={`${textClass ?? 'text-5xl md:text-8xl'} font-black text-foreground/90 tracking-tighter uppercase z-10 text-center break-words max-w-[90vw]`}
      >
        {text ?? "CrowdSourced Udemy"}
      </div>
    </div>
  );
}
