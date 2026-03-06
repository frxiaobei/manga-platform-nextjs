"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Flame, Clock, DollarSign, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { api, getCharacterPreviewImage } from "@/lib/api-client";

export default function Home() {
  const featuredQuery = useQuery({
    queryKey: ["featured-characters"],
    queryFn: () => api.characters.list({ limit: 4 }),
  });

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-8 py-12 sm:py-20">
      {/* Hero Section */}
      <section className="mb-24 md:mb-32 lg:mb-48 relative">
        <div className="absolute -top-40 -left-20 w-96 h-96 bg-ansha/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row gap-12 md:gap-16 lg:gap-24 items-start lg:items-end"
        >
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex items-center gap-3 text-ansha mb-8"
            >
              <div className="w-12 h-[1px] bg-ansha/50" />
              <Sparkles size={18} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.4em]">顶级原画创作平台</span>
            </motion.div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl xl:text-[11rem] font-black tracking-tighter leading-[0.8] mb-10 sm:mb-12">
              赋予角色<br />
              <span className="text-ansha inline-block hover:scale-[1.02] transition-transform cursor-default">第二生命</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-[32ch] leading-relaxed font-medium">
              汇集顶尖原画师的精品角色，从清冷仙子到霸道魔尊，每一个角色都拥有独特的灵魂。
            </p>
          </div>

          <div className="flex flex-col gap-6 w-full lg:w-auto lg:items-end group">
            <Link href="/characters" className="w-full">
              <Button size="lg" className="w-full h-16 sm:h-20 md:h-24 px-8 sm:px-12 md:px-16 rounded-2xl md:rounded-[2.5rem] text-xl sm:text-2xl md:text-3xl font-black italic group-hover:bg-ansha-light transition-all duration-500 flex items-center justify-between">
                <span>立即探索图库</span>
                <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform duration-500" />
              </Button>
            </Link>
            <Link
              href="/promo/review"
              className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground transition-all hover:text-ansha flex items-center gap-2 group/link"
            >
              评价换折扣
              <ArrowUpRight size={16} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Featured Characters */}
      <section>
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 md:mb-16 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-ansha animate-ping" />
              <span className="text-ansha text-xs font-bold uppercase tracking-widest">Featured</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">精选角色投稿</h2>
            <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-bold">本周最受关注的原创角色作品</p>
          </div>

          <div className="flex flex-wrap gap-2 glass p-2 rounded-2xl border-white/5">
            {[
              { label: "热门作品", icon: Flame },
              { label: "最新上线", icon: Clock },
              { label: "最高价格", icon: DollarSign },
            ].map((item) => (
              <button
                key={item.label}
                className="min-h-12 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2 text-muted-foreground hover:text-white"
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {featuredQuery.isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-[3rem] bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {featuredQuery.isError && (
          <div className="rounded-[3rem] border border-red-500/30 bg-red-500/5 p-12 text-center glass">
            <p className="text-red-300/80 mb-6 font-medium text-lg">精选角色加载失败，请稍后重试。</p>
            <Button variant="outline" size="lg" className="rounded-2xl" onClick={() => featuredQuery.refetch()}>
              重试
            </Button>
          </div>
        )}

        {!featuredQuery.isLoading && !featuredQuery.isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(featuredQuery.data?.items ?? []).map((character, i) => (
              <Link key={character.id} href={`/characters/${character.id}`} className="block group">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                >
                  <div className="aspect-[3/4] rounded-[2.5rem] md:rounded-[3.5rem] bg-zinc-900/50 border border-white/5 flex flex-col justify-end p-8 md:p-10 overflow-hidden relative mb-6 group-hover:border-ansha/50 group-hover:shadow-[0_0_50px_rgba(230,126,34,0.15)] transition-all duration-700">
                    <img
                      src={getCharacterPreviewImage(character)}
                      alt={character.title}
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-[1.05] group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-700" />

                    <div className="relative z-10 translate-y-6 group-hover:translate-y-0 transition-transform duration-700 ease-[0.16, 1, 0.3, 1]">
                      <div className="flex gap-2 mb-4">
                        {character.tags.slice(0, 1).map((tag) => (
                          <Tag key={tag.id} className="text-[10px] uppercase font-black tracking-widest bg-ansha/20 text-ansha border-none px-3 py-1">
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black mb-2 group-hover:text-ansha transition-colors tracking-tighter">
                        {character.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-8 line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 leading-relaxed font-medium">
                        {character.description ?? "每个灵魂都有其独特的故事，待你发掘其背后的秘密。"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg md:text-xl font-black text-ansha/80 tracking-tighter italic">
                          #{character.id.slice(0, 6)}
                        </span>
                        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-700 delay-200">
                          <ArrowRight size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

