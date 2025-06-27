"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrambleText from './ScrambleText';

gsap.registerPlugin(ScrollTrigger);

export default function SplitHeader() {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageContRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animSwipeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!heroRef.current) return;

    // Set initial state - swipe overlays cover everything
    gsap.set(animSwipeRefs.current, {
      yPercent: 0
    });

    // Set initial state for hero content
    gsap.set(".hero__content", {
      opacity: 1,
      y: 0
    });

    // Main transition timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "200vh top",
        scrub: 1,
        onUpdate: (self) => {
          // When scroll progress reaches 50%, start revealing the learning section
          if (self.progress > 0.5) {
            // Make the hero less visible to show learning section behind
            gsap.to(heroRef.current, {
              opacity: 1 - (self.progress - 0.5) * 2,
              duration: 0.1
            });
          }
        }
      }
    });

    // Phase 1: Fade out hero content (0-30% scroll)
    tl.to(".hero__content", {
      opacity: 0,
      y: -100,
      duration: 0.3,
      ease: "power2.out"
    })
    // Phase 2: Start sliding up the black overlays (30-100% scroll)
    .to(animSwipeRefs.current, {
      yPercent: -100,
      duration: 0.7,
      stagger: {
        from: "start",
        each: 0.05
      },
      ease: "power2.inOut"
    }, 0.3);

    // Parallax effect on background
    gsap.to(".hero__bg-black", {
      yPercent: -30,
      scale: 1.1,
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "200vh top",
        scrub: 1.5
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="hero" ref={heroRef}>
      <div className="hero__inner">
        {Array.from({ length: 6 }, (_, index) => (
          <div 
            key={index}
            className="hero__image-cont"
            ref={(el) => { imageContRefs.current[index] = el; }}
          >
            <div 
              className="hero__bg-black"
              style={{
                position: 'absolute',
                width: '700%',
                height: '100%',
                top: 0,
                left: `${-100 * (index + 1)}%`,
                backgroundColor: '#000000'
              }}
            />
            <div 
              className="anim-swipe"
              ref={(el) => { animSwipeRefs.current[index] = el; }}
            />
          </div>
        ))}
      </div>
      
      {/* Content overlay */}
      <div className="hero__content">
        <div className="hero__text">
          <ScrambleText 
            text="Knowful"
            className="hero__title"
            delay={0}
          />
          <ScrambleText 
            text="Learn at the Speed of Thought"
            className="hero__subtitle"
            delay={0.8}
          />
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-arrow">↓</div>
      </div>
    </div>
  );
}
