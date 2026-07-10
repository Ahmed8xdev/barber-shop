"use client";

import { useRef } from "react";
import { gsap } from "gsap";

interface TrendCardProps {
  title: string;
  subtitle: string;
  score: number;
  url: string;
  icon: React.ReactNode;
  index: number;
}

export default function TrendCard({ title, subtitle, score, url, icon, index }: TrendCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 12;
    const rotateY = -((x - centerX) / centerX) * 12;

    gsap.to(card, {
      rotationX: rotateX,
      rotationY: rotateY,
      scale: 1.04,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  return (
    <a
      ref={cardRef}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group block rounded-sm border border-bronze/10 bg-white p-5 hover:border-bronze/30 transition-colors duration-300 perspective-container"
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-bronze/10 flex items-center justify-center text-xs font-bold text-bronze">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-bronze transition-colors leading-snug">
            {title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-sand-muted">
            <span className="font-medium text-bronze">{subtitle}</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-bronze/40" />
              {score}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
