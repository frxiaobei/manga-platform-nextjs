"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Flame, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { api, getCharacterPreviewImage } from "@/lib/api-client";

export default function Home() {
  const featuredQuery = useQuery({
    queryKey: ["featured-characters"],
    queryFn: () => api.characters.list({ limit: 4 }),
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-12">
      {/* Hero Section */}
      <section className="mb-16 md:mb-24 lg:mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row gap-10 md:gap-14 lg:gap-20 items-center lg:items-end"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 text-ansha mb-6">
              <Sparkles size={20} />
              <span className="text-sm font-bold uppercase tracking-[0.3em]">顶级原画创作平台</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl xl:text-[10rem] font-bold tracking-tighter leading-[0.9] md:leading-[0.85] mb-6 sm:mb-8">
              赋予角色<br />
              <span className="text-ansha">第二生命</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/40 max-w-[40ch] leading-relaxed">
              汇集顶尖原画师的精品角色，从清冷仙子到霸道魔尊，每一个角色都拥有独特的灵魂与背景设定。
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto lg:items-end">
            <Link href="/characters" className="flex-1">
              <Button size="lg" className="w-full h-14 sm:h-16 md:h-20 px-6 sm:px-10 md:px-12 rounded-[1.5rem] md:rounded-[2rem] text-base sm:text-lg md:text-xl font-black italic">
                立即探索图库
                <ArrowRight size={24} className="ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Featured Characters */}
      <section>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-5 md:gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">精选角色投稿</h2>
            <p className="text-white/40 text-sm uppercase tracking-widest font-bold">本周最受关注的原创角色作品</p>
          </div>
          <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-[1.25rem] md:rounded-[1.5rem] border border-white/5">
            {[
              { label: "热门作品", icon: Flame },
              { label: "最新上线", icon: Clock },
              { label: "最高价格", icon: DollarSign },
            ].map((item) => (
              <button
                key={item.label}
                className="min-h-11 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2 text-white/40 hover:text-white"
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {featuredQuery.isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}
        {featuredQuery.isError && (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-300 mb-4">精选角色加载失败，请稍后重试。</p>
            <Button variant="outline" onClick={() => featuredQuery.refetch()}>
              重试
            </Button>
          </div>
        )}
        {!featuredQuery.isLoading && !featuredQuery.isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {(featuredQuery.data?.items ?? []).map((character, i) => (
              <Link key={character.id} href={`/characters/${character.id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[3/4] rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-end p-5 sm:p-6 md:p-8 overflow-hidden relative mb-4 md:mb-6 group-hover:border-ansha/30 transition-all duration-500">
                    <img
                      src={getCharacterPreviewImage(character)}
                      alt={character.title}
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                    <div className="relative z-10 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex gap-2 mb-3">
                        {character.tags.slice(0, 1).map((tag) => (
                          <Tag key={tag.id} variant="success" className="text-[10px]">{tag.name}</Tag>
                        ))}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-1 group-hover:text-ansha transition-colors">{character.title}</h3>
                      <p className="text-white/40 text-sm mb-6 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        {character.description ?? "暂无角色描述"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg md:text-xl font-black text-ansha tracking-tight">#{character.id.slice(0, 6)}</span>
                        <Button size="icon" className="rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                          <ArrowRight size={20} />
                        </Button>
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
