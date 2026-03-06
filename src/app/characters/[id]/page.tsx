"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Heart, Share2, ShieldCheck, X, AlertTriangle, Sparkles, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
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

  // Admin review state
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reason, setReason] = useState("");

  const characterQuery = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => api.characters.getById(characterId),
    enabled: Boolean(characterId),
  });

  const userQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => api.auth.me().catch(() => null),
  });

  const images = useMemo(() => {
    const character = characterQuery.data;
    if (!character) return [];
    const urls = character.assets.filter((a) => a.url).map((a) => a.url!);
    return urls.length > 0 ? urls : ["/placeholder.svg"];
  }, [characterQuery.data]);

  // Handle out of bounds index when images change
  const currentIndex = Math.min(selectedImageIndex, Math.max(0, images.length - 1));

  const handleReview = async (status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES") => {
    if (status !== "APPROVED" && !reason) {
      alert("请输入审核意见/拒绝理由");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${characterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "审核操作失败");
      }

      alert("审核完成");
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "审核操作失败");
    } finally {
      setReviewLoading(false);
    }
  };

  const isNotFound =
    characterQuery.isError &&
    typeof characterQuery.error === "object" &&
    "status" in characterQuery.error &&
    (characterQuery.error as { status: number }).status === 404;

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-[1000px] px-8 py-32">
        <div className="glass rounded-[3rem] p-16 text-center border-ansha/20">
          <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl bg-ansha/10">
            <AlertTriangle size={40} className="text-ansha" />
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tighter text-white uppercase">角色不存在 或已下架</h2>
          <p className="mb-10 text-muted-foreground font-medium">该角色可能已被移除，请返回首页浏览其他角色。</p>
          <Button size="lg" className="rounded-2xl px-12" onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  if (characterQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-8 py-20 animate-pulse">
        <div className="h-8 w-32 bg-white/5 rounded-xl mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <div className="aspect-[3/4] rounded-[3.5rem] bg-white/5 mb-8" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-20 w-3/4 bg-white/5 rounded-2xl mb-6" />
            <div className="h-8 w-1/2 bg-white/5 rounded-xl mb-12" />
            <div className="h-80 w-full rounded-[3rem] bg-white/5 mb-12" />
            <div className="h-48 w-full rounded-[2.5rem] bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (characterQuery.isError || !characterQuery.data) {
    return (
      <div className="mx-auto max-w-[1000px] px-8 py-32">
        <div className="glass rounded-[3rem] p-16 text-center border-white/5">
          <p className="text-muted-foreground mb-8 font-medium text-lg">角色详情加载失败，请稍后重试。</p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="lg" className="rounded-2xl" onClick={() => characterQuery.refetch()}>
              重试
            </Button>
            <Button size="lg" className="rounded-2xl" onClick={() => router.push("/")}>返回首页</Button>
          </div>
        </div>
      </div>
    );
  }

  const character = characterQuery.data;
  const totalAssetCount = character.assets.length;
  const stats = [
    { label: "素材总数", value: `${totalAssetCount}` },
    ...(character.locked_asset_count > 0 ? [{ label: "待解锁", value: `${character.locked_asset_count}` }] : [{ label: "状态", value: "已解锁" }]),
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

  const user = userQuery.data;

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-16 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-ansha/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <button
        onClick={() => router.push("/characters")}
        className="flex items-center gap-3 text-muted-foreground hover:text-white transition-all mb-12 group"
      >
        <div className="size-10 glass rounded-xl flex items-center justify-center group-hover:-translate-x-1 transition-transform">
          <ArrowLeft size={18} />
        </div>
        <span className="font-black uppercase tracking-[0.2em] text-xs">Back to Library</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative z-10">
        {/* Left: Image Gallery */}
        <div className="space-y-6 sm:space-y-8">
          <motion.div
            layoutId="main-image"
            onClick={() => setIsLightboxOpen(true)}
            className="aspect-[3/4] rounded-[3rem] md:rounded-[4rem] overflow-hidden bg-zinc-900/50 border border-white/5 cursor-zoom-in relative group shadow-2xl"
          >
            {images[currentIndex] && (
              <img
                src={images[currentIndex]}
                alt={character.name}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute bottom-8 right-8 size-14 glass rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-700">
              <Sparkles size={24} className="text-ansha" />
            </div>
          </motion.div>

          <div className="grid grid-cols-4 gap-4 sm:gap-6">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border-2 transition-all duration-500 active:scale-90",
                  currentIndex === index ? "border-ansha scale-95 shadow-[0_0_20px_rgba(230,126,34,0.3)]" : "border-transparent opacity-40 hover:opacity-100 hover:scale-105"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <div className="mb-10 md:mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-ansha" />
              <span className="text-ansha text-xs font-black uppercase tracking-[0.3em]">Exclusive Character</span>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.8] mb-6">{character.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl sm:text-3xl text-muted-foreground font-black italic tracking-tighter">#{character.id.slice(0, 8)}</span>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex gap-2">
                {character.tags.slice(0, 3).map(tag => (
                  <Tag key={tag.id} className="bg-white/5 border-white/5 text-white/40">{tag.name}</Tag>
                ))}
              </div>
            </div>
          </div>

          <div className="glass border-white/5 rounded-[3rem] md:rounded-[4rem] p-10 sm:p-12 md:p-16 mb-10 md:mb-14 relative overflow-hidden group">
            <div className="absolute -bottom-20 -right-20 size-64 bg-ansha/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-ansha/10 transition-colors duration-700" />

            <div className="flex items-center justify-between mb-10 md:mb-12">
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="size-14 rounded-2xl border-white/10 hover:border-ansha/50 hover:text-ansha transition-all">
                  <Heart size={24} />
                </Button>
                <Button variant="outline" size="icon" className="size-14 rounded-2xl border-white/10 hover:border-ansha/50 hover:text-ansha transition-all">
                  <Share2 size={24} />
                </Button>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Market Price</p>
                <p className="text-4xl font-black text-ansha italic tracking-tighter">PREMIUM</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-12">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white/5 rounded-3xl p-6 border border-white/5 group/stat hover:border-white/20 transition-colors">
                  <span className="text-[10px] text-muted-foreground block uppercase font-black tracking-[0.2em] mb-2 group-hover:text-white transition-colors">{stat.label}</span>
                  <span className="text-2xl font-black italic tracking-tight">{stat.value}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-20 sm:h-24 text-xl sm:text-2xl font-black italic tracking-tight rounded-[2rem] sm:rounded-[2.5rem] group/btn"
              size="lg"
              onClick={handlePurchase}
              disabled={isPaying || character.is_purchased}
            >
              {character.is_purchased ? (
                <>
                  <Download size={28} className="mr-3" />
                  立即下载素材
                </>
              ) : (
                <>
                  <ShoppingCart size={28} className="mr-3 group-hover/btn:translate-x-1 transition-transform" />
                  {isPaying ? "正在跳转支付..." : "立即购买授权"}
                </>
              )}
            </Button>

            {purchaseError && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-sm text-red-400 font-bold text-center bg-red-400/5 p-4 rounded-xl border border-red-400/10"
              >
                {purchaseError}
              </motion.p>
            )}

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                <ShieldCheck size={16} className="text-ansha/40" />
                SECURE TRANSACTION & COMMERCIAL LICENSE
              </div>
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="size-8 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center overflow-hidden">
                    <div className="size-full bg-ansha/20" />
                  </div>
                ))}
                <div className="size-8 rounded-full border-2 border-zinc-950 bg-ansha text-[10px] font-black flex items-center justify-center">
                  +12
                </div>
              </div>
            </div>
          </div>

          {/* Admin Review Panel */}
          {user?.role === "ADMIN" && (
            <div className="mb-10 p-10 glass border-ansha/20 rounded-[3rem] space-y-8">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-ansha/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-ansha" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tight text-ansha">管理员审核 / Admin Review</h3>
              </div>
              
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-4">审核意见 / 理由 (拒绝或需修改时必填)</label>
                <textarea
                  className="w-full bg-black/40 border border-white/5 rounded-[2rem] px-8 py-6 text-lg focus:outline-none focus:ring-2 focus:ring-ansha/50 min-h-[160px] transition-all"
                  placeholder="请输入详细的审核意见..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleReview("APPROVED")} 
                  disabled={reviewLoading}
                  className="bg-green-600 hover:bg-green-700 text-sm font-black italic h-16 rounded-2xl shadow-lg shadow-green-900/20"
                >
                  通过 / APPROVE
                </Button>
                <Button 
                  onClick={() => handleReview("NEEDS_CHANGES")} 
                  disabled={reviewLoading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-sm font-black italic h-16 rounded-2xl shadow-lg shadow-yellow-900/20"
                >
                  需修改 / REVISE
                </Button>
                <Button 
                  onClick={() => handleReview("REJECTED")} 
                  disabled={reviewLoading}
                  className="bg-red-600 hover:bg-red-700 text-sm font-black italic h-16 rounded-2xl shadow-lg shadow-red-900/20"
                >
                  拒绝 / REJECT
                </Button>
              </div>
            </div>
          )}

          <div className="mb-14">
            <RatingStars characterId={character.id} />
          </div>

          <div className="space-y-6 md:space-y-10">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black uppercase tracking-[0.2em] whitespace-nowrap">角色设定 / Setting</h3>
              <div className="h-px w-full bg-white/5" />
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-[1.8] text-lg font-medium text-pretty">
                {character.description ?? "每个灵魂都有其独特的故事，待你发掘其背后的秘密。"}
              </p>
            </div>
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
            className="fixed inset-0 z-[200] bg-zinc-950/98 flex items-center justify-center p-6 md:p-16 backdrop-blur-2xl"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-10 right-10 size-16 rounded-2xl glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[210] group"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-full max-h-full aspect-[3/4]"
            >
              <img
                src={images[currentIndex]}
                className="w-full h-full object-contain rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
                alt=""
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
