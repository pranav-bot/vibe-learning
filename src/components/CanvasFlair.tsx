"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function CanvasFlair() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const ctx = c.getContext("2d");

    let cw = (c.width = window.innerWidth);
    let ch = (c.height = window.innerHeight);
    let radius = Math.max(cw, ch);

    const particles = Array.from({ length: 99 }, (_, i) => {
      const img = new Image();
      img.src = `https://assets.codepen.io/16327/flair-${2 + (i % 21)}.png`;

      return {
        x: 0,
        y: 0,
        scale: 0,
        rotate: 0,
        img,
      };
    });

    const draw = () => {
      particles.sort((a, b) => a.scale - b.scale);
      ctx.clearRect(0, 0, cw, ch);

      particles.forEach((p) => {
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(p.rotate);
        ctx.drawImage(
          p.img,
          p.x,
          p.y,
          p.img.width * p.scale,
          p.img.height * p.scale
        );
        ctx.resetTransform();
      });
    };

    const tl = gsap
      .timeline({ onUpdate: draw })
      .fromTo(
        particles,
        {
          x: (i) => {
            const angle =
              (i / particles.length) * Math.PI * 2 - Math.PI / 2;
            return Math.cos(angle * 10) * radius;
          },
          y: (i) => {
            const angle =
              (i / particles.length) * Math.PI * 2 - Math.PI / 2;
            return Math.sin(angle * 10) * radius;
          },
          scale: 1.1,
          rotate: 0,
        },
        {
          duration: 5,
          ease: "sine.inOut",
          x: 0,
          y: 0,
          scale: 0,
          rotate: -3,
          stagger: { each: -0.05, repeat: -1 },
        },
        0
      )
      .seek(99);

    const onResize = () => {
        const parent = c.parentElement;
        cw = c.width = parent.offsetWidth;
        ch = c.height = parent.offsetHeight;
        radius = Math.max(cw, ch);
        tl.invalidate();
    };

    const onPointerUp = () => {
      gsap.to(tl, {
        timeScale: tl.isActive() ? 0 : 1,
      });
    };

    window.addEventListener("resize", onResize);
    c.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("resize", onResize);
      c.removeEventListener("pointerup", onPointerUp);
      tl.kill();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
