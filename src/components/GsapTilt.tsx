"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

interface GsapTiltProps {
  children: React.ReactNode;
  className?: string;
}

export default function GsapTilt({ children, className = "" }: GsapTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!container || !card) return;

    gsap.set(card, { transformPerspective: 1000, transformStyle: "preserve-3d" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * 18;
      const rotateY = -((x - centerX) / centerX) * 18;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        scale: 1.03,
        boxShadow: "0 25px 50px rgba(197, 168, 128, 0.2)",
        border: "1px solid rgba(197, 168, 128, 0.4)",
        ease: "power2.out",
        duration: 0.2,
        overwrite: "auto",
      });

      if (glow) {
        gsap.to(glow, {
          x: x - rect.width / 2,
          y: y - rect.height / 2,
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        boxShadow: "0 4px 20px rgba(197, 168, 128, 0.08)",
        border: "1px solid rgba(197, 168, 128, 0.1)",
        ease: "power3.out",
        duration: 0.5,
        overwrite: "auto",
      });
      if (glow) {
        gsap.to(glow, {
          opacity: 0,
          duration: 0.5,
        });
      }
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full relative ${className}`}>
      <div
        ref={glowRef}
        className="absolute pointer-events-none z-10 w-48 h-48 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle, rgba(197,168,128,0.2) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          left: "50%",
          top: "50%",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={cardRef}
        className={`w-full h-full relative ${isHovered ? "z-20" : "z-0"}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(197,168,128,0.08) 0%, transparent 50%, rgba(197,168,128,0.03) 100%)",
          }}
        />
      </div>
    </div>
  );
}
