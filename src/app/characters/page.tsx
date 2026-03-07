"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetch-auth";

type CharacterListItem = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  price: number;
  assets: Array<{ id: string; url: string | null }>;
};

type AuthUser = { id: string };

export default function CharactersPage() {
  const [items, setItems] = useState<CharacterListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [charactersRes, meRes] = await Promise.all([
          fetch("/api/characters?limit=50"),
          fetchWithAuth("/api/auth/me"),
        ]);
        const characterData = await charactersRes.json();
        const meData = meRes.ok ? await meRes.json() : null;
        if (!mounted) return;
        setItems(characterData.items ?? []);
        setCurrentUser(meData?.id ? { id: meData.id } : null);
      } catch {
        if (mounted) setError("角色列表加载失败");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-10">加载中...</main>;
  if (error) return <main className="mx-auto max-w-5xl px-6 py-10 text-red-600">{error}</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">角色列表</h1>
        <Link href="/">
          <Button variant="outline">首页</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const isOwner = currentUser?.id === item.owner_id;
          const cover = item.assets?.[0]?.url ?? "";
          return (
            <article key={item.id} className="rounded-lg border p-4">
              {cover ? (
                <img src={cover} alt={item.title} className="mb-3 h-48 w-full rounded-md object-cover" />
              ) : null}
              <h2 className="text-lg font-medium">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.description ?? "暂无描述"}</p>
              <p className="mt-2 font-medium">¥ {item.price.toFixed(2)}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/characters/${item.id}`}>
                  <Button size="sm">查看详情</Button>
                </Link>
                {isOwner ? (
                  <Link href={`/characters/${item.id}/edit`}>
                    <Button size="sm" variant="outline">
                      编辑
                    </Button>
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

