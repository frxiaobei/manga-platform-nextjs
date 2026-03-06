"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ArrowRight } from "lucide-react";
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
    <div className="mx-auto max-w-[1400px] px-6 py-12">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter mb-4">角色图库</h1>
          <p className="text-white/40 max-w-[40ch]">浏览并发现您最喜爱的漫剧角色，支持按标签精准筛选。</p>
        </div>
        <div className="w-full md:w-[400px] relative">
          <Input
            placeholder="搜索角色名或称号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-12 bg-white/5 p-6 rounded-[2rem] border border-white/10">
        <div className="flex items-center gap-2 mr-4 text-white/60">
          <Filter size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">筛选:</span>
        </div>
        {tagsQuery.isLoading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-white/10 animate-pulse" />
        ))}
        {(tagsQuery.data ?? []).map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.slug)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
              selectedTags.includes(tag.slug)
                ? "bg-ansha border-ansha text-white shadow-[0_0_15px_rgba(230,126,34,0.3)]"
                : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20"
            )}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {charactersQuery.isLoading && (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid rounded-[2.5rem] bg-white/5 border border-white/5 p-4 animate-pulse">
              <div className="aspect-[4/5] rounded-[2rem] bg-white/10" />
              <div className="mt-4 h-5 w-1/2 bg-white/10 rounded" />
              <div className="mt-2 h-4 w-2/3 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}
      {charactersQuery.isError && (
        <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-300 mb-4">角色数据加载失败，请稍后重试。</p>
          <Button variant="outline" onClick={() => charactersQuery.refetch()}>
            重试
          </Button>
        </div>
      )}
      {!charactersQuery.isLoading && !charactersQuery.isError && (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((char) => (
              <motion.div
                layout
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="break-inside-avoid"
              >
                <Link href={`/characters/${char.id}`} className="block">
                  <div className="group relative rounded-[2.5rem] bg-zinc-900 border border-white/5 overflow-hidden cursor-pointer hover:border-ansha/30 transition-all duration-500">
                    <div className="aspect-[4/5] bg-white/5 relative overflow-hidden">
                      <img
                        src={getCharacterPreviewImage(char)}
                        alt={char.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    </div>

                    <div className="absolute inset-0 flex flex-col justify-end p-8 translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex gap-2 mb-3">
                        {char.tags.slice(0, 2).map((tag) => (
                          <Tag key={tag.id} variant="default">
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{char.title}</h3>
                      <p className="text-white/40 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-2">
                        {char.description ?? "暂无角色描述"}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-white/40 block mb-1">角色 ID</span>
                          <span className="text-xl font-bold text-ansha">#{char.id.slice(0, 6)}</span>
                        </div>
                        <Button size="icon" className="rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                          <ArrowRight size={20} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-20 flex justify-center">
        <Button variant="outline" size="lg" className="rounded-full px-12">
          加载更多角色
        </Button>
      </div>
    </div>
  );
}
