"use client";

import { useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.refresh();
    } catch {}
  }, []);

  return <>{children}</>;
}
