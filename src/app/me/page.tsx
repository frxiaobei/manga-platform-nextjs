"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
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
  { key: "purchased", label: "我买的" },
  { key: "listed", label: "我上架的" },
  { key: "review", label: "审核入口" },
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
  const showPurchased = activeTab === "purchased";
  const showListed = activeTab === "listed";
  const showReview = activeTab === "review";

  if (meQuery.isLoading || charactersQuery.isLoading || purchasesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="h-12 w-64 rounded bg-white/10 animate-pulse mb-6" />
        <div className="h-24 w-full rounded-[2rem] bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-20">
        <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-300 mb-4">个人中心加载失败，请先登录。</p>
          <Link href="/login">
            <Button variant="outline">去登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-12 space-y-8 sm:space-y-10">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">个人中心</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">{getUserDisplayName(user.email)}</h1>
          <p className="text-white/40">查看我买的、我上架的，以及角色审核状态。</p>
        </div>
      </section>

      {/* Mobile tabs */}
      <section className="md:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto rounded-2xl bg-white/5 p-2 border border-white/10">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition-colors min-h-11 ${
                activeTab === tab.key
                  ? "bg-ansha text-white"
                  : "bg-transparent text-white/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Purchased */}
      <section className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-8 ${showPurchased ? "" : "hidden"} md:block`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-2xl font-bold">我买的</h2>
          <span className="text-sm text-white/40">{myPurchased.length} 个角色</span>
        </div>
        {myPurchased.length === 0 ? (
          <p className="text-white/40 text-sm">暂无购买记录。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPurchased.map((item) => (
              <Link key={item.character_id} href={`/characters/${item.character_id}`} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 hover:border-white/20 transition-colors">
                {item.hero_image_url && (
                  <img
                    src={item.hero_image_url}
                    alt={item.character_name}
                    className="aspect-[3/4] w-full rounded-xl object-cover mb-3"
                  />
                )}
                <p className="font-bold">{item.character_name}</p>
                <p className="mt-1 text-xs text-white/50">支付 ${item.price_paid.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Listed */}
      <section className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-8 ${showListed ? "" : "hidden"} md:block`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-2xl font-bold">我上架的</h2>
          <span className="text-sm text-white/40">{myCharacters.length} 个角色</span>
        </div>
        {myCharacters.length === 0 ? (
          <p className="text-white/40 text-sm">还没有上架角色。</p>
        ) : (
          <div className="space-y-3">
            {myCharacters.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
                <img src={getCharacterPreviewImage(item)} alt={item.title} className="size-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/characters/${item.id}`} className="font-bold hover:text-ansha transition-colors">
                    {item.title}
                  </Link>
                  <p className="text-sm text-white/40 truncate">#{item.id.slice(0, 6)}</p>
                </div>
                <Tag>{statusText[item.status] ?? item.status}</Tag>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review */}
      <section className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-8 ${showReview ? "" : "hidden"} md:block`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-2xl font-bold">审核入口</h2>
          <span className="text-sm text-white/40">{reviewItems.length} 条记录</span>
        </div>
        {reviewItems.length === 0 ? (
          <div className="inline-flex items-center gap-2 text-emerald-400">
            <CheckCircle size={18} />
            <span>当前没有待处理审核项。</span>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <Link href={`/characters/${item.id}`} className="font-bold hover:text-ansha transition-colors">
                    {item.title}
                  </Link>
                  {item.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 text-sm text-red-400">
                      <AlertCircle size={16} />
                      已拒绝
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-ansha">
                      <Clock size={16} />
                      {statusText[item.status] ?? item.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40">{item.review_reason ?? "审核中，暂无反馈。"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
