"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollHoverText({ compact = false }: { compact?: boolean }) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (compact) return; // skip scroll animations for compact mode

    const ctx = gsap.context(() => {
      const textElements = gsap.utils.toArray<HTMLElement>(".scroll-text");

      textElements.forEach((text) => {
        gsap.to(text, {
          backgroundSize: "100% 100%",
          ease: "none",
          scrollTrigger: {
            trigger: text,
            start: "center 80%",
            end: "center 70%",
            scrub: true,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [compact]);

  return (
    <section
      ref={rootRef}
      className={compact ? "flex flex-col items-end justify-center p-2 space-y-2" : "min-h-screen flex flex-col items-start justify-center px-6 space-y-8"}
    >
      {/* Headline */}
      <h1
        className={"scroll-text relative font-extrabold cursor-pointer overflow-hidden " + (compact ? 'text-lg md:text-xl' : 'text-5xl md:text-7xl')}
        style={{
          backgroundImage: "linear-gradient(to right, #b6b6b6, #b6b6b6)",
          backgroundSize: "0% 100%",
          backgroundRepeat: "no-repeat",
          color: "lightgrey",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        Learn at the Speed of Thought
        <span
          className="reveal-text"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#4246ce",
            color: "#0D0D0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          GRASP
        </span>
      </h1>

      {/* Subheadline */}
      <h2
        className={"scroll-text relative font-semibold cursor-pointer overflow-hidden " + (compact ? 'text-xs md:text-sm' : 'text-xl md:text-2xl')}
        style={{
          backgroundImage: "linear-gradient(to right, #b6b6b6, #b6b6b6)",
          backgroundSize: "0% 100%",
          backgroundRepeat: "no-repeat",
          color: "whiteSmoke",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        Structured learning, powered by the internet.
        <span
          className="reveal-text"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#6b46c1", // purple
            color: "#0D0D0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          CURATED
        </span>
      </h2>

      {/* Extra hover line */}
      <h1
        className={"scroll-text relative font-bold cursor-pointer overflow-hidden " + (compact ? 'text-sm md:text-base' : 'text-3xl md:text-4xl')}
        style={{
          backgroundImage: "linear-gradient(to right, #b6b6b6, #b6b6b6)",
          backgroundSize: "0% 100%",
          backgroundRepeat: "no-repeat",
          color: "grey",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        Hover on me
        <span
          className="reveal-text"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#38a169", // green
            color: "#0D0D0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          WOW
        </span>
      </h1>

      {/* Hover effect styles */}
      <style jsx>{`
        .reveal-text {
          clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
          transition: all 0.4s cubic-bezier(.1,.5,.5,1);
        }
        h1:hover .reveal-text,
        h2:hover .reveal-text {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }
      `}</style>
    </section>
  );
}
