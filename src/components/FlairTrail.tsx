"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function FlairTrail() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const flair = gsap.utils.toArray(container.querySelectorAll(".flair"));
    if (!flair.length) return;

    gsap.defaults({ duration: 1 });

    let gap = 100;
    let index = 0;
    let wrapper = gsap.utils.wrap(0, flair.length);

    let mousePos = { x: 0, y: 0 };
    let lastMousePos = { x: 0, y: 0 };
    let cachedMousePos = { x: 0, y: 0 };

    const playAnimation = (shape) => {
      gsap
        .timeline()
        .from(shape, {
          opacity: 0,
          scale: 0,
          ease: "elastic.out(1,0.3)",
        })
        .to(
          shape,
          {
            rotation: "random([-360, 360])",
          },
          "<"
        )
        .to(
          shape,
          {
            y: "120vh",
            ease: "back.in(.4)",
            duration: 1,
          },
          0
        );
    };

    const animateImage = () => {
      const wrappedIndex = wrapper(index);
      const img = flair[wrappedIndex];

      gsap.killTweensOf(img);
      gsap.set(img, { clearProps: "all" });

      gsap.set(img, {
        opacity: 1,
        left: mousePos.x,
        top: mousePos.y,
        xPercent: -50,
        yPercent: -50,
        position: "fixed",
        pointerEvents: "none",
      });

      playAnimation(img);
      index++;
    };

    const ImageTrail = () => {
      const travelDistance = Math.hypot(
        lastMousePos.x - mousePos.x,
        lastMousePos.y - mousePos.y
      );

      cachedMousePos.x = gsap.utils.interpolate(
        cachedMousePos.x || mousePos.x,
        mousePos.x,
        0.1
      );
      cachedMousePos.y = gsap.utils.interpolate(
        cachedMousePos.y || mousePos.y,
        mousePos.y,
        0.1
      );

      if (travelDistance > gap) {
        animateImage();
        lastMousePos = { ...mousePos };
      }
    };

    const onMouseMove = (e) => {
      mousePos = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", onMouseMove);
    gsap.ticker.add(ImageTrail);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      gsap.ticker.remove(ImageTrail);
      gsap.killTweensOf(flair);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0">
      {Array.from({ length: 21 }).map((_, i) => (
        <img
          key={i}
          src={`https://assets.codepen.io/16327/flair-${i + 2}.png`}
          className="flair absolute h-8 w-8 opacity-0"
          alt=""
          draggable={false}
        />
      ))}
    </div>
  );
}
