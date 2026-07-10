"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TestimonialCarouselProps {
  items: ReactNode[];
  itemsPerPage?: number;
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.92,
  }),
};

export default function TestimonialCarousel({ items, itemsPerPage = 2 }: TestimonialCarouselProps) {
  const [[page, dir], setPage] = useState([0, 0]);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const index = Math.min(page, totalPages - 1);

  const visibleItems = items.slice(index * itemsPerPage, (index + 1) * itemsPerPage);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, totalPages - 1));
    setPage([clamped, clamped > page ? 1 : -1]);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -60) goTo(page + 1);
    if (info.offset.x > 60) goTo(page - 1);
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {visibleItems}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="p-2 rounded-sm border border-bronze/20 text-bronze hover:bg-espresso-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "bg-bronze w-4" : "bg-bronze/20 hover:bg-bronze/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-sm border border-bronze/20 text-bronze hover:bg-espresso-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
