"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function ScrambleText({ text, className = "", delay = 0 }: ScrambleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const originalText = text;
    
    // Create span elements for each character
    containerRef.current.innerHTML = '';
    const charElements: HTMLSpanElement[] = [];
    
    [...originalText].forEach((char, _i) => {
      const span = document.createElement('span');
      const randomChar = chars[Math.floor(Math.random() * chars.length)];
      span.textContent = char === ' ' ? '\u00A0' : (randomChar ?? '');
      span.style.display = 'inline-block';
      charElements.push(span);
      containerRef.current?.appendChild(span);
    });

    // Animation timeline
    const tl = gsap.timeline({ delay });
    
    // Animate each character one by one
    charElements.forEach((charElement, index) => {
      const originalChar = originalText[index];
      if (originalChar === ' ') {
        // Skip spaces, just set them immediately
        charElement.textContent = '\u00A0';
        return;
      }

      tl.to({}, {
        duration: 1.5, // Increased duration for smoother effect
        ease: "power2.out",
        onUpdate: function() {
          // Type assertion for GSAP context
          const gsapThis = this as { progress(): number };
          const progress = gsapThis.progress();
          if (Math.random() < progress * 1.5) { // Adjusted probability for smoother reveal
            charElement.textContent = originalChar ?? '';
          } else {
            const randomChar = chars[Math.floor(Math.random() * chars.length)];
            charElement.textContent = randomChar ?? '';
          }
        },
        onComplete: function() {
          charElement.textContent = originalChar ?? '';
        }
      }, index * 0.05); // Reduced stagger for smoother sequential reveal
    });

    return () => {
      tl.kill();
    };
  }, [text, delay]);

  return (
    <div ref={containerRef} className={className}>
      {text}
    </div>
  );
}
