"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Heart, Share2, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { RatingStars } from "@/components/rating-stars";

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const characterQuery = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => api.characters.getById(characterId),
    enabled: Boolean(characterId),
  });

  const images = useMemo(() => {
    const character = characterQuery.data;
    if (!character) return [];
    const urls = character.assets.filter((a) => a.url).map((a) => a.url!);
    return urls.length > 0 ? urls : ["/placeholder.svg"];
  }, [characterQuery.data]);

  useEffect(() => {
    if (selectedImageIndex > images.length - 1) {
      setSelectedImageIndex(0);
    }
  }, [images, selectedImageIndex]);

  const isNotFound =
    characterQuery.isError &&
    typeof characterQuery.error === "object" &&
    "status" in characterQuery.error &&
    (characterQuery.error as { status: number }).status === 404;

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-20">
        <div className="rounded-[2rem] border border-ansha/20 bg-ansha/5 p-10 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-ansha/10">
            <AlertTriangle size={32} className="text-ansha" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">角色不存在或已下架</h2>
          <p className="mb-8 text-sm text-white/40">该角色可能已被移除，请返回首页浏览其他角色</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  if (characterQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-12 animate-pulse">
        <div className="h-6 w-28 bg-white/10 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <div className="aspect-[3/4] rounded-[3rem] bg-white/10 mb-6" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/10" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-12 w-2/3 bg-white/10 rounded mb-4" />
            <div className="h-6 w-1/2 bg-white/10 rounded mb-8" />
            <div className="h-64 w-full rounded-[2.5rem] bg-white/10 mb-8" />
            <div className="h-40 w-full rounded-[2rem] bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (characterQuery.isError || !characterQuery.data) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/60 mb-4">角色详情加载失败，请稍后重试。</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => characterQuery.refetch()}>
              重试
            </Button>
            <Button onClick={() => router.push("/")}>返回首页</Button>
          </div>
        </div>
      </div>
    );
  }

  const character = characterQuery.data;
  const totalAssetCount = character.assets.length;
  const stats = [
    { label: "素材数", value: `${totalAssetCount}` },
    { label: "价格", value: `¥${character.price.toFixed(2)}` },
    ...(character.locked_asset_count > 0 ? [{ label: "未解锁", value: `${character.locked_asset_count}` }] : []),
  ];

  const handlePurchase = async () => {
    setPurchaseError(null);
    setIsPaying(true);
    try {
      const origin = window.location.origin;
      const response = await api.checkout.createSession(
        character.id,
        `${origin}/characters/${character.id}?purchased=true`,
        `${origin}/characters/${character.id}`
      );
      window.location.assign(response.checkout_url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "创建支付会话失败，请稍后重试。";
      setPurchaseError(message);
      setIsPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-12">
      {/* Navigation */}
      <button
        onClick={() => router.push("/characters")}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-wider text-xs">返回列表</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Left: Image Gallery */}
        <div className="space-y-4 sm:space-y-6">
          <motion.div
            layoutId="main-image"
            onClick={() => setIsLightboxOpen(true)}
            className="aspect-[3/4] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white/5 border border-white/5 cursor-zoom-in relative group"
          >
            {images[selectedImageIndex] && (
              <img
                src={images[selectedImageIndex]}
                alt={character.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all",
                  selectedImageIndex === index ? "border-ansha scale-95" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <div className="mb-6 md:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-2">{character.name}</h1>
            <p className="text-xl sm:text-2xl text-white/40 font-medium">角色 #{character.id.slice(0, 6)}</p>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-6 md:p-8 mb-6 md:mb-8">
            <div className="flex items-center justify-end mb-6 md:mb-8">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-2xl">
                  <Heart size={24} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl">
                  <Share2 size={24} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-[10px] text-white/40 block uppercase tracking-widest mb-1">{stat.label}</span>
                  <span className="font-bold">{stat.value}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-14 sm:h-16 text-base sm:text-lg rounded-[1.25rem] sm:rounded-[1.5rem]"
              size="lg"
              onClick={handlePurchase}
              disabled={isPaying || character.is_purchased}
            >
              <ShoppingCart size={24} className="mr-2" />
              {character.is_purchased
                ? "已购买"
                : isPaying
                ? "跳转支付中..."
                : `立即购买并下载 (¥${character.price.toFixed(2)})`}
            </Button>
            {purchaseError ? <p className="mt-3 text-sm text-red-300">{purchaseError}</p> : null}

            <p className="text-center text-xs text-white/20 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck size={14} />
              购买后永久拥有，支持商业用途许可
            </p>
          </div>

          <RatingStars characterId={character.id} />

          <div className="space-y-4 md:space-y-6 pt-6 md:pt-8">
            <h3 className="text-xl font-bold tracking-tight border-b border-white/5 pb-4">角色设定</h3>
            <p className="text-white/60 leading-relaxed text-base sm:text-lg">
              {character.description ?? "暂无角色描述"}
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/95 flex items-center justify-center p-4 md:p-12"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-8 right-8 size-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors z-[210]"
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={images[selectedImageIndex]}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
