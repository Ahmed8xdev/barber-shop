"use client";

import { useState, useEffect } from "react";
import { Star, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  text: string;
  author: string;
  subreddit: string;
  score: number;
}

interface TestimonialsSectionProps {
  locale: string;
}

export default function TestimonialsSection({ locale }: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 2;

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.testimonials?.length) setTestimonials(res.testimonials);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(testimonials.length / perPage));
  const displayed = testimonials.slice(page * perPage, (page + 1) * perPage);

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
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-h-[200px]">
              {displayed.map((t, i) => (
                <div
                  key={`${t.author}-${i}`}
                  className="rounded-sm border border-bronze/10 bg-white p-8 space-y-4 bronze-glow"
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
                  <p className="text-sm leading-relaxed text-sand-muted/95 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-sand-muted">
                    <Star className="h-3 w-3 fill-bronze text-bronze" />
                    <span>{t.score}</span>
                  </div>
                </div>
              ))}
              {displayed.length === 0 && (
                <div className="col-span-full text-center py-12 text-sand-muted text-sm">
                  {locale === "ar" ? "لا توجد آراء حالياً" : "No feedback available at the moment."}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-sm border border-bronze/20 text-bronze hover:bg-espresso-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-sand-muted font-mono">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-sm border border-bronze/20 text-bronze hover:bg-espresso-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}