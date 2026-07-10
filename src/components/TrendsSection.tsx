"use client";

import { useState, useEffect } from "react";
import { getTranslations } from "@/lib/translations";
import { ExternalLink, TrendingUp, MessageCircle, Play } from "lucide-react";
import TrendCard from "./TrendCard";
import CardStack from "./CardStack";

interface RedditPost {
  title: string;
  subreddit: string;
  score: number;
  url: string;
  created: number;
}

interface YouTubeVideo {
  title: string;
  channel: string;
  views: string;
  url: string;
  thumbnail: string;
  videoId: string;
}

interface TrendsData {
  reddit: RedditPost[];
  youtube: YouTubeVideo[];
}

interface TrendsSectionProps {
  locale: string;
}

export default function TrendsSection({ locale }: TrendsSectionProps) {
  const t = getTranslations(locale);
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reddit' | 'youtube'>('reddit');

  useEffect(() => {
    fetch('/api/trends')
      .then(r => r.json())
      .then(res => {
        if (res.success) setData({ reddit: res.reddit || [], youtube: res.youtube || [] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="trends" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-bronze/10 bg-espresso-dark/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-bronze/20 bg-espresso-dark px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-bronze gsap-reveal">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{locale === "ar" ? "أحدث الصيحات من ريديت ويوتيوب" : "Trending from Reddit & YouTube"}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl gsap-reveal">
            {locale === "ar" ? "مجتمع العناية الشخصية" : "Grooming Community"}
          </h2>
          <p className="text-base text-sand-muted max-w-2xl mx-auto gsap-reveal">
            {locale === "ar"
              ? "أحدث المناقشات وصيحات تصفيف الشعر من ريديت ويوتيوب - يتم التحديث تلقائياً."
              : "Fresh discussions and trending videos from Reddit and YouTube — updated automatically."}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab('reddit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'reddit'
                ? 'bg-bronze text-white'
                : 'border border-bronze/20 text-sand-muted hover:border-bronze/40'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Reddit • {data?.reddit?.length || 0}</span>
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-bronze text-white'
                : 'border border-bronze/20 text-sand-muted hover:border-bronze/40'
            }`}
          >
            <Play className="h-4 w-4" />
            <span>YouTube • {data?.youtube?.length || 0}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-bronze border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-sand-muted mt-4 animate-pulse">
              {locale === "ar" ? "جاري تحميل أحدث الصيحات..." : "Loading latest trends..."}
            </p>
          </div>
        ) : activeTab === 'reddit' ? (
          <CardStack>
            {data?.reddit?.slice(0, 24).map((post, i) => (
              <TrendCard
                key={post.url + i}
                title={post.title}
                subtitle={`r/${post.subreddit}`}
                score={post.score}
                url={post.url}
                icon={<ExternalLink className="h-3.5 w-3.5" />}
                index={i}
              />
            ))}
            {(!data?.reddit || data.reddit.length === 0) && (
              <div className="col-span-full text-center py-12 text-sand-muted text-sm">
                {locale === "ar" ? "لا توجد مناقشات حالياً" : "No discussions available at the moment."}
              </div>
            )}
          </CardStack>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.youtube?.slice(0, 9).map((video, i) => (
              <div
                key={video.videoId + i}
                className="group rounded-sm border border-bronze/10 bg-white overflow-hidden hover:border-bronze/30 transition-all duration-300 perspective-container"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}?rel=0&showinfo=0`}
                    title={video.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-bronze transition-colors">
                    {video.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-sand-muted">
                    <span className="truncate max-w-[60%]">{video.channel}</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <TrendingUp className="h-3 w-3" />
                      {video.views} views
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.youtube || data.youtube.length === 0) && (
              <div className="col-span-full text-center py-12 text-sand-muted text-sm">
                {locale === "ar" ? "لا توجد فيديوهات متاحة حالياً" : "No videos available at the moment."}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
