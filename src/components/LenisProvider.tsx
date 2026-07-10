"use client";

import { useEffect, useRef, useState, createContext, useContext, ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ScrollContextValue {
  lenis: Lenis | null;
  scrollProgress: number;
}

const ScrollContext = createContext<ScrollContextValue>({
  lenis: null,
  scrollProgress: 0,
});

export const useScroll = () => useContext(ScrollContext);

export default function ScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", (e: { progress: number }) => {
      setScrollProgress(e.progress);
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis: lenisRef.current, scrollProgress }}>
      {children}
    </ScrollContext.Provider>
  );
}
