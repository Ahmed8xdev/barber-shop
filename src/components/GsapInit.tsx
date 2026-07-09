"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function GsapInit() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const elements = document.querySelectorAll(".gsap-reveal");
    elements.forEach((el) => {
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
            toggleActions: "play none none none"
          }
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
            toggleActions: "play none none none"
          }
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
            toggleActions: "play none none none"
          }
        }
      );
    }

    const counterElements = document.querySelectorAll(".gsap-counter");
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
          toggleActions: "play none none none"
        },
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toString();
        }
      });
    });

    const baronText = document.querySelector("#bg-4d-text");
    if (baronText) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        }
      });

      tl.to(baronText, {
        scale: 1.8,
        rotateX: 25,
        rotateY: -25,
        opacity: 0.08,
      }, 0)
      .to(baronText, {
        scale: 2.2,
        rotateX: 35,
        rotateY: -35,
        opacity: 0.12,
      }, 0.5)
      .to(baronText, {
        x: "-5%",
        y: "-10%",
        scale: 2.5,
        rotateX: 45,
        rotateY: -45,
        opacity: 0.05,
      }, 0.8);

      gsap.to(baronText, {
        y: -5,
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }
  }, []);

  return null;
}
