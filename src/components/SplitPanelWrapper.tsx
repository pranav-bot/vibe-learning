"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrambleText from "./ScrambleText";

gsap.registerPlugin(ScrollTrigger);

export default function SplitPanelWrapper() {
  useEffect(() => {
    // Create timeline for the split panel animation
    const tl = gsap.timeline();

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
    ).from(
      "#landing-content", 
      {
        y: 50,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      "<0.1" // Start as panels are opening
    );

    // Create ScrollTrigger to drive the timeline
    ScrollTrigger.create({
      animation: tl,
      trigger: document.body,
      start: "top top",
      end: "100vh top",
      scrub: 1,
      onLeave: () => {
        // When animation completes, remove the spacer section and reset scroll
        const spacer = document.getElementById("intro-spacer");
        if (spacer) {
          spacer.style.display = "none";
          
          // Hide wrapper immediately
          gsap.set(".split-header-wrapper", { display: "none" });
          
          // Kill all scroll triggers to prevent reversal
          ScrollTrigger.getAll().forEach(trigger => trigger.kill());
          
          // Snap to top of content
          window.scrollTo(0, 0);
        }
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
          <div className="absolute left-0 right-0 top-full mt-4 animate-bounce">
            <span className="text-sm text-gray-500 opacity-0 animate-[fadeIn_0.5s_ease-out_2.5s_forwards]">
            Scroll down to know more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
