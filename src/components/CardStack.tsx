"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface CardStackProps {
  children: ReactNode[];
  className?: string;
}

export default function CardStack({ children, className = "" }: CardStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    if (cards.length === 0) return;

    cards.forEach((card, i) => {
      gsap.set(card, {
        opacity: 0,
        y: 40,
        rotateX: 5,
        transformPerspective: 1000,
      });

      gsap.to(card, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: i * 0.06,
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [children.length]);

  return (
    <div
      ref={containerRef}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {children.map((child, i) => (
        <div
          key={i}
          ref={(el) => { if (el) cardsRef.current[i] = el; }}
          className="perspective-container"
      style={{ transformStyle: "preserve-3d" }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
