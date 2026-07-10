"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useScroll } from "./LenisProvider";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const { scrollProgress } = useScroll();

  useEffect(() => {
    if (!barRef.current) return;
    gsap.to(barRef.current, {
      scaleX: scrollProgress,
      duration: 0.1,
      ease: "none",
      overwrite: "auto",
    });
  }, [scrollProgress]);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[9997] pointer-events-none">
      <div
        ref={barRef}
        className="h-full bg-bronze origin-left"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
