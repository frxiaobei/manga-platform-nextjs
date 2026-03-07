"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetch-auth";

type CharacterAsset = {
  id: string;
  category: string;
  url: string | null;
  locked?: boolean;
};

type CharacterDetail = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  price: number;
  status: string;
  tags: string[];
  assets: CharacterAsset[];
};

type AuthUser = { id: string };

export default function CharacterDetailPage() {
  const params = useParams<{ characterId: string }>();
  const characterId = params.characterId;
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [characterRes, meRes] = await Promise.all([
          fetchWithAuth(`/api/characters/${characterId}`),
          fetchWithAuth("/api/auth/me"),
        ]);
        if (!characterRes.ok) throw new Error("角色不存在");
        const characterData = await characterRes.json();
        const meData = meRes.ok ? await meRes.json() : null;
        if (!mounted) return;
        setCharacter(characterData);
        setCurrentUser(meData?.id ? { id: meData.id } : null);
      } catch {
        if (mounted) setError("角色详情加载失败");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [characterId]);

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-10">加载中...</main>;
  if (error || !character)
    return <main className="mx-auto max-w-3xl px-6 py-10 text-red-600">{error ?? "角色不存在"}</main>;

  const isOwner = currentUser?.id === character.owner_id;
  const tagsText = character.tags.length ? character.tags.join(", ") : "无";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/characters">
          <Button variant="outline">返回列表</Button>
        </Link>
        {isOwner ? (
          <Link href={`/characters/${character.id}/edit`}>
            <Button>编辑角色</Button>
          </Link>
        ) : null}
      </div>
      <h1 className="text-2xl font-semibold">{character.name}</h1>
      <p className="mt-2 text-muted-foreground">{character.description ?? "暂无描述"}</p>
      <div className="mt-4 space-y-1 text-sm">
        <p>价格: ¥ {character.price.toFixed(2)}</p>
        <p>状态: {character.status}</p>
        <p>标签: {tagsText}</p>
      </div>
      <section className="mt-6 grid gap-3 md:grid-cols-2">
        {character.assets.map((asset) => (
          <div key={asset.id} className="rounded-md border p-2">
            {asset.url ? (
              <img src={asset.url} alt={`${character.name}-${asset.category}`} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">
                已锁定
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{asset.category}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

