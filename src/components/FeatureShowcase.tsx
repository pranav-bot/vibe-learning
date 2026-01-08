"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Structured Roadmaps",
    description: "Visualize your learning path with a clear, hierarchical structure. Topics are color-coded by difficulty level, helping you progress from foundational concepts to advanced mastery.",
    image: "/roadmapoverviewlevelwise.png",
    imageAlt: "Roadmap overview showing level-wise structure",
    reverse: false
  },
  {
    title: "Interactive Learning Map",
    description: "Navigate through your learning journey with an intuitive map interface. Understand the relationships between topics and track your progress visually.",
    image: "/mapinteractionlegend.png",
    imageAlt: "Map interaction legend",
    reverse: true
  },
  {
    title: "Deep Dive into Topics",
    description: "Click on any node to expand details. Get instant access to curated resources, both fetched and pending, ensuring you have the best materials at your fingertips.",
    image: "/topicdetailswithresourcesfetched.png",
    imageAlt: "Topic details with resources",
    reverse: false
  },
  {
    title: "On-Demand Resource Generation",
    description: "Don't see what you need? Our AI agents actively search and verify new resources in real-time. Watch as 'unfetched' topics transform into rich learning libraries.",
    image: "/topicdetailswithresourcesunfetched.png",
    imageAlt: "Topic details before resources are fetched",
    reverse: true
  },
  {
    title: "Clear Progression Indicators",
    description: "Easily distinguish between beginner, intermediate, and advanced topics through our intuitive color-coding system. Know exactly where you stand in your learning journey.",
    image: "/topiclevelscolorcolding.png",
    imageAlt: "Topic levels color coding",
    reverse: false
  }
];

export default function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      features.forEach((feature, index) => {
        const row = document.querySelector(`.feature-row-${index}`);
        const text = row?.querySelector(".feature-text");
        const image = row?.querySelector(".feature-image");

        if (row && text && image) {
          gsap.fromTo(text, 
            {
              x: feature.reverse ? 50 : -50,
              opacity: 0
            },
            {
              scrollTrigger: {
                trigger: row,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
              },
              x: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out"
            }
          );

          gsap.fromTo(image,
            {
              x: feature.reverse ? -50 : 50,
              opacity: 0,
              scale: 0.95
            },
            {
              scrollTrigger: {
                trigger: row,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
              },
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 1,
              ease: "power3.out",
              delay: 0.2
            }
          );
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-24">
          Features
        </h2>
        
        <div className="space-y-32">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-row-${index} flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}
            >
              <div className="feature-text flex-1 space-y-6">
                <h3 className="text-3xl font-bold">{feature.title}</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              <div className="feature-image flex-1 w-full">
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card/50">
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4 transition-transform hover:scale-105 duration-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
