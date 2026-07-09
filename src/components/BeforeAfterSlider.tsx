"use client";

import { useState, useRef, useCallback, MouseEvent, TouchEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Scissors } from "lucide-react";

export default function BeforeAfterSlider() {
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(50);
  const x = useSpring(rawX, { stiffness: 300, damping: 30 });
  const clipRight = useTransform(x, (v) => `${100 - v}%`);

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      rawX.set(pos);
    },
    [rawX]
  );

  const handleMouseDown = (e: MouseEvent) => {
    setDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) updatePosition(e.clientX);
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) updatePosition(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      className="relative w-full aspect-video rounded-sm overflow-hidden border border-bronze/20 bg-espresso-light select-none cursor-ew-resize touch-none"
    >
      {/* Before */}
      <div className="absolute inset-0 bg-espresso-dark flex items-center justify-center">
        <motion.div
          className="text-center space-y-2 opacity-40"
          animate={{ scale: dragging ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Scissors className="h-10 w-10 mx-auto text-sand-muted" />
          <span className="block text-xs uppercase tracking-widest">Before</span>
        </motion.div>
      </div>

      {/* After (clipped) */}
      <motion.div
        className="absolute inset-0 bg-[#1C1612] flex items-center justify-center"
        style={{ clipPath: useTransform(x, (v) => `inset(0 ${100 - v}% 0 0)`) }}
      >
        <motion.div
          className="text-center space-y-2"
          animate={{ scale: dragging ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Scissors className="h-10 w-10 mx-auto text-bronze" />
          <span className="block text-xs uppercase tracking-widest text-bronze font-bold">After</span>
        </motion.div>
      </motion.div>

      {/* Divider line */}
      <motion.div
        className="absolute top-0 bottom-0 w-0.5 bg-bronze z-20 pointer-events-none"
        style={{ left: x }}
      >
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full border-2 border-bronze bg-espresso-dark flex items-center justify-center shadow-xl"
          animate={{ scale: dragging ? 1.15 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-sm text-bronze font-bold select-none">↔</span>
        </motion.div>
      </motion.div>

      <div className="absolute left-4 bottom-4 z-30 pointer-events-none rounded-full bg-espresso-dark/85 px-3 py-1 text-[10px] uppercase tracking-wider border border-bronze/10 text-sand-muted">
        Before
      </div>
      <div className="absolute right-4 bottom-4 z-30 pointer-events-none rounded-full bg-bronze/90 px-3 py-1 text-[10px] uppercase tracking-wider text-espresso-dark font-bold">
        After
      </div>
    </div>
  );
}
