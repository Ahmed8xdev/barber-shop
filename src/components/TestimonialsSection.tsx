"use client";

import { useState, useEffect, useRef } from "react";
import { Star, MessageCircle } from "lucide-react";
import gsap from "gsap";
import TestimonialCarousel from "./TestimonialCarousel";

interface Testimonial {
  text: string;
  author: string;
  subreddit: string;
  score: number;
}

interface TestimonialsSectionProps {
  locale: string;
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    gsap.to(card, {
      rotationX: ((y - cy) / cy) * 10,
      rotationY: -((x - cx) / cx) * 10,
      scale: 1.02,
      boxShadow: "0 20px 50px rgba(197, 168, 128, 0.2)",
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
      boxShadow: "0 4px 20px rgba(197, 168, 128, 0.08)",
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-sm border border-bronze/10 bg-white p-8 space-y-4 h-full flex flex-col cursor-default perspective-container"
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-bronze/10 flex items-center justify-center text-xs font-bold text-bronze">
            {t.author[0]?.toUpperCase()}
          </span>
          <span className="font-bold text-sm">u/{t.author}</span>
        </div>
        <a
          href={`https://reddit.com/r/${t.subreddit}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-sand-muted hover:text-bronze flex items-center gap-1"
        >
          <MessageCircle className="h-3 w-3" />
          <span>r/{t.subreddit}</span>
        </a>
      </div>
      <p className="text-sm leading-relaxed text-sand-muted/95 italic flex-1">
        &ldquo;{t.text}&rdquo;
      </p>
      <div className="flex items-center gap-2 text-[10px] text-sand-muted">
        <Star className="h-3 w-3 fill-bronze text-bronze" />
        <span>{t.score}</span>
      </div>
    </div>
  );
}

export default function TestimonialsSection({ locale }: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.testimonials?.length) setTestimonials(res.testimonials);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center space-y-4 mb-16">
          <div className="flex justify-center gap-1 gsap-reveal">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-bronze text-bronze" />
            ))}
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl gsap-reveal">
            {locale === "ar" ? "ماذا يقول المستخدمون" : "What Users Say"}
          </h2>
          <p className="text-base text-sand-muted gsap-reveal">
            {locale === "ar" ? "آراء حقيقية من مجتمع ريديت" : "Real feedback from the Reddit grooming community"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-bronze border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-sand-muted mt-3 animate-pulse">
              {locale === "ar" ? "جلب أحدث الآراء..." : "Fetching latest feedback..."}
            </p>
          </div>
        ) : (
          <TestimonialCarousel
            items={testimonials.map((t, i) => (
              <TestimonialCard key={`${t.author}-${i}`} t={t} />
            ))}
            itemsPerPage={2}
          />
        )}
      </div>
    </section>
  );
}
