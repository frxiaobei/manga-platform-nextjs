"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, AlertCircle, Sparkles, User, Package, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { api, getCharacterPreviewImage } from "@/lib/api-client";
import type { ApiCharacter } from "@/lib/api-client";
import { useCurrentUser, getUserDisplayName } from "@/lib/auth-client";

const statusText: Record<string, string> = {
  approved: "已过审",
  pending: "审核中",
  submitted: "待审核",
  rejected: "已拒绝",
  draft: "草稿",
};

const dashboardTabs = [
  { key: "purchased", label: "我买的", icon: Package },
  { key: "listed", label: "我上架的", icon: User },
  { key: "review", label: "审核状态", icon: ShieldCheck },
] as const;

type DashboardTabKey = (typeof dashboardTabs)[number]["key"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTabKey>("purchased");
  const meQuery = useCurrentUser();
  const user = meQuery.data;

  const charactersQuery = useQuery({
    queryKey: ["dashboard-characters"],
    queryFn: () => api.characters.list({ limit: 100 }),
    enabled: Boolean(user),
  });
  const purchasesQuery = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => api.me.purchases(),
    enabled: Boolean(user),
  });

  const myCharacters = useMemo(() => {
    if (!user) return [] as ApiCharacter[];
    return (charactersQuery.data?.items ?? []).filter((item) => item.owner_id === user.id);
  }, [charactersQuery.data?.items, user]);

  const myPurchased = purchasesQuery.data ?? [];
  const reviewItems = myCharacters.filter((item) => item.status !== "approved");

  if (meQuery.isLoading || charactersQuery.isLoading || purchasesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-8 py-20 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-xl mb-8" />
        <div className="h-40 w-full rounded-[2.5rem] bg-white/5" />
      </div>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <div className="mx-auto max-w-[1000px] px-8 py-32">
        <div className="glass rounded-[3rem] p-16 text-center border-red-500/20">
          <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">个人中心加载失败</h2>
          <p className="text-muted-foreground font-medium mb-10">请先登录您的账户以访问此页面。</p>
          <Link href="/login">
            <Button size="lg" className="rounded-2xl px-12">前往登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-20">
      <section className="mb-20 relative">
        <div className="absolute -top-20 -left-10 w-64 h-64 bg-ansha/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={16} className="text-ansha" />
            <span className="text-ansha text-xs font-black uppercase tracking-[0.3em]">Profile Dashboard</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            {getUserDisplayName(user.email)}
          </h1>
          <p className="text-muted-foreground text-lg max-w-[45ch] font-medium leading-relaxed">
            管理您的个人资产、查看作品审核状态以及更新您的账户信息。
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="mb-16">
        <div className="glass p-2 rounded-2xl md:rounded-[2rem] border-white/5 inline-flex flex-wrap gap-2">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-xl md:rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-500 active:scale-95",
                activeTab === tab.key
                  ? "bg-ansha text-white shadow-[0_4px_20px_rgba(230,126,34,0.3)]"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {/* Purchased */}
        {activeTab === "purchased" && (
          <motion.section
            key="purchased"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tighter uppercase">已购角色 / Purchased</h2>
              <div className="h-10 px-4 glass rounded-xl flex items-center justify-center text-xs font-black italic text-ansha">
                {myPurchased.length} UNITS
              </div>
            </div>
            
            {myPurchased.length === 0 ? (
              <div className="py-20 text-center">
                <Package size={48} className="text-white/10 mx-auto mb-6" />
                <p className="text-muted-foreground font-medium">您还没有购买过任何角色。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myPurchased.map((item) => (
                  <Link 
                    key={item.character_id} 
                    href={`/characters/${item.character_id}`} 
                    className="group rounded-[2rem] border border-white/5 bg-zinc-900/50 p-6 hover:border-ansha/30 transition-all duration-500"
                  >
                    <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden mb-6 relative">
                      {item.hero_image_url && (
                        <img
                          src={item.hero_image_url}
                          alt={item.character_name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black tracking-tighter group-hover:text-ansha transition-colors">{item.character_name}</p>
                      <ArrowRight size={20} className="text-ansha opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                    </div>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/20 italic">Transaction Success</p>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Listed */}
        {activeTab === "listed" && (
          <motion.section
            key="listed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tighter uppercase">上架管理 / Collections</h2>
              <div className="h-10 px-4 glass rounded-xl flex items-center justify-center text-xs font-black italic text-ansha">
                {myCharacters.length} ITEMS
              </div>
            </div>
            
            {myCharacters.length === 0 ? (
              <div className="py-20 text-center">
                <User size={48} className="text-white/10 mx-auto mb-6" />
                <p className="text-muted-foreground font-medium">还没有上架角色作品。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myCharacters.map((item) => (
                  <div key={item.id} className="group flex items-center gap-6 rounded-[2rem] border border-white/5 bg-zinc-900/50 p-6 hover:border-ansha/30 transition-all duration-500">
                    <img src={getCharacterPreviewImage(item)} alt={item.title} className="size-20 rounded-2xl object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/characters/${item.id}`} className="text-xl font-black tracking-tighter hover:text-ansha transition-colors block mb-1">
                        {item.title}
                      </Link>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">#{item.id.slice(0, 8)}</p>
                    </div>
                    <Tag className={cn(
                      item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      item.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      'bg-ansha/10 text-ansha border-ansha/20'
                    )}>
                      {statusText[item.status] ?? item.status}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Review */}
        {activeTab === "review" && (
          <motion.section
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16"
          >
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tighter uppercase">审核动态 / Timeline</h2>
              <div className="h-10 px-4 glass rounded-xl flex items-center justify-center text-xs font-black italic text-ansha">
                {reviewItems.length} UPDATES
              </div>
            </div>
            
            {reviewItems.length === 0 ? (
              <div className="py-20 text-center glass rounded-3xl border-emerald-500/10 bg-emerald-500/5">
                <CheckCircle size={48} className="text-emerald-500/20 mx-auto mb-6" />
                <p className="text-emerald-500 font-black uppercase tracking-widest">所有作品已通过审核</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewItems.map((item) => (
                  <div key={item.id} className="rounded-[2rem] border border-white/5 bg-zinc-900/50 p-8 relative overflow-hidden group">
                    {item.status === 'rejected' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />}
                    {item.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-ansha/50" />}
                    
                    <div className="flex items-center justify-between gap-6 mb-6">
                      <Link href={`/characters/${item.id}`} className="text-2xl font-black tracking-tighter hover:text-ansha transition-colors">
                        {item.title}
                      </Link>
                      
                      <div className="flex items-center gap-3">
                        {item.status === "rejected" ? (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={14} />
                            Revision Needed
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ansha/10 text-ansha text-[10px] font-black uppercase tracking-widest">
                            <Clock size={14} className="animate-spin-slow" />
                            Under Review
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 group-hover:border-white/10 transition-colors">
                      <p className="text-muted-foreground font-medium leading-relaxed">
                        {item.review_reason ?? "我们的审核团队正在仔细检查您的作品设定与资产包，请耐心等待反馈。"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
