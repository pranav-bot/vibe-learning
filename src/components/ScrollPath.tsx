"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ScrollPathAnimation() {
  const rootRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const createTimeline = () => {
      ctxRef.current && ctxRef.current.revert();

      ctxRef.current = gsap.context(() => {
        const box = document.querySelector(".box");
        if (!box) return;

        const boxStartRect = box.getBoundingClientRect();

        const containers = gsap.utils.toArray(
          ".container:not(.initial)"
        );

        const points = containers.map((container) => {
          const marker =
            container.querySelector(".marker") || container;
          const r = marker.getBoundingClientRect();

          return {
            x:
              r.left +
              r.width / 2 -
              (boxStartRect.left + boxStartRect.width / 2),
            y:
              r.top +
              r.height / 2 -
              (boxStartRect.top + boxStartRect.height / 2),
          };
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: ".container.initial",
            start: "clamp(top center)",
            endTrigger: ".final",
            end: "clamp(top center)",
            scrub: 1,
          },
        }).to(".box", {
          duration: 1,
          ease: "none",
          motionPath: {
            path: points,
            curviness: 1.5,
          },
        });
      }, rootRef);
    };

    createTimeline();
    window.addEventListener("resize", createTimeline);

    return () => {
      window.removeEventListener("resize", createTimeline);
      ctxRef.current && ctxRef.current.revert();
      ScrollTrigger.killAll();
    };
  }, []);

  return (
    <div ref={rootRef}>
      {/* Example structure */}
      <section className="container initial h-screen flex items-center justify-center">
        <div className="box w-12 h-12 bg-red-500 rounded-full" />
      </section>

      <section className="container h-screen flex items-center justify-center">
        <div className="marker w-4 h-4 bg-blue-500 rounded-full" />
      </section>

      <section className="container h-screen flex items-center justify-center">
        <div className="marker w-4 h-4 bg-green-500 rounded-full" />
      </section>

      <section className="container final h-screen flex items-center justify-center">
        <div className="marker w-4 h-4 bg-purple-500 rounded-full" />
      </section>
    </div>
  );
}
