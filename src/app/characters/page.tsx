"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ArrowRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, getCharacterPreviewImage } from "@/lib/api-client";

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const charactersQuery = useQuery({
    queryKey: ["characters", selectedTags],
    queryFn: () => api.characters.list({ tags: selectedTags }),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: api.tags.list,
  });

  const filteredCharacters = (charactersQuery.data?.items ?? []).filter((char) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      char.title.toLowerCase().includes(keyword) ||
      (char.description ?? "").toLowerCase().includes(keyword);
    const matchesTags = selectedTags.length === 0 || selectedTags.every((t) => char.tags.some((tag) => tag.slug === t));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-20">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-20 relative">
        <div className="absolute -top-20 -left-10 w-64 h-64 bg-ansha/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={16} className="text-ansha" />
            <span className="text-ansha text-xs font-black uppercase tracking-[0.3em]">Library</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">角色图库</h1>
          <p className="text-muted-foreground text-lg max-w-[40ch] font-medium leading-relaxed">
            浏览并发现您最喜爱的漫剧角色，支持按标签精准筛选。
          </p>
        </div>

        <div className="w-full lg:w-[460px] relative group">
          <Input
            placeholder="搜索角色名或称号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-16 pl-14 rounded-2xl bg-zinc-900/50 border-white/5 focus:border-ansha/50 transition-all duration-500 text-lg font-medium"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-ansha transition-colors" size={24} />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-20 glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ansha/5 rounded-full blur-3xl pointer-events-none group-hover:bg-ansha/10 transition-colors" />

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex items-center gap-3 mr-6 text-white/40">
            <Filter size={18} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Filter By Tags:</span>
          </div>

          {tagsQuery.isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-xl bg-white/5 animate-pulse" />
          ))}

          <AnimatePresence>
            {(tagsQuery.data ?? []).map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.slug)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 border active:scale-95",
                  selectedTags.includes(tag.slug)
                    ? "bg-ansha border-ansha text-white shadow-[0_4px_20px_rgba(230,126,34,0.4)]"
                    : "bg-white/5 border-white/5 text-muted-foreground hover:text-white hover:border-white/20"
                )}
              >
                {tag.name}
              </button>
            ))}
          </AnimatePresence>

          {selectedTags.length > 0 && (
            <button 
              onClick={() => setSelectedTags([])}
              className="text-[10px] font-black uppercase tracking-widest text-ansha hover:text-ansha-light transition-colors ml-4"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {charactersQuery.isLoading && (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid rounded-[3rem] bg-white/5 border border-white/5 p-6 animate-pulse">
              <div className="aspect-[4/5] rounded-[2.5rem] bg-white/10" />
              <div className="mt-6 h-6 w-1/2 bg-white/10 rounded-lg" />
              <div className="mt-3 h-4 w-2/3 bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {charactersQuery.isError && (
        <div className="rounded-[3rem] border border-red-500/30 bg-red-500/5 p-16 text-center glass">
          <p className="text-red-300/80 mb-6 font-medium text-lg text-pretty">角色数据加载失败，请稍后重试。</p>
          <Button variant="outline" size="lg" className="rounded-2xl" onClick={() => charactersQuery.refetch()}>
            重试
          </Button>
        </div>
      )}

      {!charactersQuery.isLoading && !charactersQuery.isError && (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((char) => (
              <motion.div
                layout
                key={char.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="break-inside-avoid"
              >
                <Link href={`/characters/${char.id}`} className="block group">
                  <div className="relative rounded-[2.5rem] bg-zinc-900/50 border border-white/5 overflow-hidden cursor-pointer hover:border-ansha/50 group-hover:shadow-[0_0_50px_rgba(230,126,34,0.1)] transition-all duration-700">
                    <div className="aspect-[4/5] bg-white/5 relative overflow-hidden">
                      <img
                        src={getCharacterPreviewImage(char)}
                        alt={char.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-700" />
                    </div>

                    <div className="absolute inset-0 flex flex-col justify-end p-8 translate-y-6 group-hover:translate-y-0 transition-transform duration-700 ease-[0.16, 1, 0.3, 1]">
                      <div className="flex gap-2 mb-4">
                        {char.tags.slice(0, 2).map((tag) => (
                          <Tag key={tag.id} className="text-[10px] uppercase font-black tracking-widest bg-ansha/20 text-ansha border-none px-3 py-1">
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2 group-hover:text-ansha transition-colors tracking-tighter">{char.title}</h3>
                      <p className="text-muted-foreground text-sm mb-8 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 line-clamp-2 font-medium leading-relaxed">
                        {char.description ?? "每个灵魂都有其独特的故事，待你发掘其背后的秘密。"}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1">Character ID</span>
                          <span className="text-xl font-black text-ansha italic tracking-tighter">#{char.id.slice(0, 6)}</span>
                        </div>
                        <div className="size-12 rounded-2xl glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-700 delay-200">
                          <ArrowRight size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredCharacters.length > 0 && (
        <div className="mt-32 flex justify-center">
          <Button variant="outline" size="lg" className="rounded-2xl px-16 h-16 text-lg font-black italic tracking-tight group">
            加载更多角色
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}

      {!charactersQuery.isLoading && filteredCharacters.length === 0 && (
        <div className="py-32 text-center glass rounded-[3rem] border-white/5">
          <Sparkles size={48} className="text-ansha/20 mx-auto mb-6" />
          <h3 className="text-2xl font-black mb-2 uppercase tracking-widest">No Characters Found</h3>
          <p className="text-muted-foreground font-medium">尝试调整筛选条件或搜索关键词。</p>
        </div>
      )}
    </div>
  );
}

