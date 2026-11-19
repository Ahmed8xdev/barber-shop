"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // quickTo reuses its tween; allocating two new gsap.to instances on
    // every mousemove creates unnecessary animation work on high-Hz mice.
    const dotX = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.25, ease: "power2.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.25, ease: "power2.out" });

    const onMouse = (e: MouseEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onDown = () => {
      gsap.to(dot, { scale: 0.5, duration: 0.15 });
      gsap.to(ring, { scale: 0.8, borderColor: "#C5A880", duration: 0.15 });
    };

    const onUp = () => {
      gsap.to(dot, { scale: 1, duration: 0.15 });
      gsap.to(ring, { scale: 1, borderColor: "rgba(197, 168, 128, 0.4)", duration: 0.15 });
    };

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      // Clear live tweens on unmount to avoid animation work after navigation.
      gsap.killTweensOf(dot);
      gsap.killTweensOf(ring);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
        style={{
          width: 6,
          height: 6,
          backgroundColor: "#C5A880",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
        style={{
          width: 32,
          height: 32,
          border: "1.5px solid rgba(197, 168, 128, 0.4)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          transition: "border-color 0.3s",
        }}
      />
    </>
  );
}
