"use client";

import { useRef, ReactNode, MouseEvent } from 'react';
import { motion, useSpring, useMotionValue, SpringOptions } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  as?: 'a' | 'button';
  href?: string;
  onClick?: () => void;
  springConfig?: SpringOptions;
}

export default function MagneticButton({
  children,
  className = '',
  as = 'a',
  href,
  onClick,
  springConfig = { stiffness: 300, damping: 20 },
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const maxDist = 10;
    const factor = Math.min(
      Math.sqrt(distX * distX + distY * distY) / 50,
      1
    );
    x.set(distX * factor * 0.3);
    y.set(distY * factor * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      <motion.div
        style={{ x: springX, y: springY }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {children}
      </motion.div>
    </div>
  );

  if (as === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {content}
    </a>
  );
}
