"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrambleText from "./ScrambleText";

gsap.registerPlugin(ScrollTrigger);

export default function SplitPanelWrapper() {
  useEffect(() => {
    // Create timeline for the split panel animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "100vh top",
        scrub: 1
      }
    });

    // Animate both panels sliding away simultaneously
    tl.to(".left-panel", {
      x: "-100%",
      duration: 1,
      ease: "power4.inOut",
    }).to(
      ".right-panel",
      {
        x: "100%",
        duration: 1,
        ease: "power4.inOut",
      },
      "<" // Start at the same time as the previous tween
    ).to(
      ".center-content",
      {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "power2.out",
      },
      "<0.2" // Start slightly after the panels begin moving
    );

    // Hide the wrapper after animation completes
    gsap.to(".split-header-wrapper", {
      display: "none",
      delay: 0.1,
      scrollTrigger: {
        trigger: document.body,
        start: "90vh top",
        toggleActions: "play none none reverse"
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="split-header-wrapper fixed inset-0 z-50 pointer-events-none">
      <div className="split-panel left-panel bg-foreground absolute top-0 left-0 w-1/2 h-full z-50"></div>
      <div className="split-panel right-panel bg-foreground absolute top-0 right-0 w-1/2 h-full z-50"></div>
      
      {/* Optional: Add some content/logo in the center during the split */}
      <div className="center-content absolute inset-0 flex items-center justify-center z-60 text-background">
        <div className="text-center">
          <ScrambleText 
            text="Knowful" 
            className="text-6xl md:text-8xl font-bold mb-4"
            delay={0.5}
          />
          <ScrambleText 
            text="Learn at the Speed of Thought" 
            className="text-xl md:text-2xl font-light"
            delay={1.5}
          />
        </div>
      </div>
    </div>
  );
}
