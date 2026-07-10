"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => setVisible(false),
    });
    tl.to("#loader-text", {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "power3.out",
    })
    .to("#loader-text", {
      opacity: 1,
      scale: 1.05,
      duration: 0.4,
      ease: "sine.inOut",
    })
    .to("#loader-sub", {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    }, "-=0.2")
    .to("#loader-bar", {
      scaleX: 1,
      duration: 0.8,
      ease: "power3.inOut",
    }, "-=0.3")
    .to("#loader-container", {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power2.in",
      delay: 0.3,
    }, "-=0.2");
  }, []);

  if (!visible) return null;

  return (
    <div
      id="loader-container"
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-white"
    >
      <div className="space-y-6 text-center">
        <h1
          id="loader-text"
          className="font-serif text-5xl tracking-[0.3em] text-bronze"
          style={{ opacity: 0, transform: "translateY(20px) scale(0.95)" }}
        >
          THE BARON
        </h1>
        <p
          id="loader-sub"
          className="text-xs tracking-[0.2em] text-sand-muted uppercase"
          style={{ opacity: 0, transform: "translateY(10px)" }}
        >
          Global Grooming Database
        </p>
        <div className="h-0.5 w-48 bg-bronze/10 rounded-full overflow-hidden mx-auto">
          <div
            id="loader-bar"
            className="h-full bg-bronze rounded-full origin-left"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
