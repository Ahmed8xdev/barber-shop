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

    let mouseX = 0;
    let mouseY = 0;

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.05, ease: "power2.out" });
      gsap.to(ring, { x: mouseX, y: mouseY, duration: 0.25, ease: "power2.out" });
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
