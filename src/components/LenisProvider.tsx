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

function initGsapReveals() {
  gsap.utils.toArray(".gsap-reveal").forEach((el: any) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );
  });

  const slideElements = document.querySelectorAll(".gsap-reveal-slide");
  if (slideElements.length > 0) {
    gsap.fromTo(
      slideElements,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: slideElements[0].parentElement || slideElements[0],
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }

  const scaleElements = document.querySelectorAll(".gsap-reveal-scale");
  if (scaleElements.length > 0) {
    gsap.fromTo(
      scaleElements,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: scaleElements[0].parentElement || scaleElements[0],
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }

  const counterElements: any[] = gsap.utils.toArray(".gsap-counter");
  counterElements.forEach((el) => {
    const target = parseInt(el.getAttribute("data-target") || "0", 10);
    if (target === 0) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toString();
      },
    });
  });

  const parallaxElements: any[] = gsap.utils.toArray("[data-parallax-speed]");
  parallaxElements.forEach((el) => {
    const speed = parseFloat(el.getAttribute("data-parallax-speed") || "0.3");
    gsap.to(el, {
      y: () => -speed * 100,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  const floatElements: any[] = gsap.utils.toArray("[data-float]");
  floatElements.forEach((el) => {
    gsap.to(el, {
      y: -8 - Math.random() * 8,
      rotate: Math.random() * 6 - 3,
      duration: 2 + Math.random() * 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 2,
    });
  });
}

function initBgTextAnimation() {
  const baronText = document.querySelector("#bg-4d-text");
  if (!baronText) return;

  gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
    },
  })
  .to(baronText, { scale: 1.8, rotateX: 25, rotateY: -25, opacity: 0.08 }, 0)
  .to(baronText, { scale: 2.2, rotateX: 35, rotateY: -35, opacity: 0.12 }, 0.5)
  .to(baronText, { x: "-5%", y: "-10%", scale: 2.5, rotateX: 45, rotateY: -45, opacity: 0.05 }, 0.8);

  gsap.to(baronText, {
    y: -5,
    duration: 4,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
  });
}

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

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      initGsapReveals();
      initBgTextAnimation();
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis: lenisRef.current, scrollProgress }}>
      {children}
    </ScrollContext.Provider>
  );
}
