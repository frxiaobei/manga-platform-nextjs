"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetch-auth";

type CharacterAsset = {
  id: string;
  category: string;
  url: string | null;
};

type CharacterDetail = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  price: number;
  tags: string[];
  assets: CharacterAsset[];
};

type AuthUser = { id: string };

export default function CharacterEditPage() {
  const params = useParams<{ characterId: string }>();
  const characterId = params.characterId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [tagsCsv, setTagsCsv] = useState("");
  const [assets, setAssets] = useState<CharacterAsset[]>([]);
  const [keepAssetIds, setKeepAssetIds] = useState<Set<string>>(new Set());
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [newAssetFiles, setNewAssetFiles] = useState<File[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [meRes, characterRes] = await Promise.all([
          fetchWithAuth("/api/auth/me"),
          fetchWithAuth(`/api/characters/${characterId}`),
        ]);
        if (!meRes.ok) throw new Error("请先登录后编辑");
        if (!characterRes.ok) throw new Error("角色不存在");

        const me: AuthUser = await meRes.json();
        const character: CharacterDetail = await characterRes.json();
        if (me.id !== character.owner_id) throw new Error("你无权编辑该角色");
        if (!mounted) return;

        setName(character.name);
        setDescription(character.description ?? "");
        setPrice(character.price.toFixed(2));
        setTagsCsv(character.tags.join(", "));
        setAssets(character.assets);
        setKeepAssetIds(new Set(character.assets.map((asset) => asset.id)));
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [characterId]);

  const coverAsset = useMemo(
    () => assets.find((asset) => asset.category === "hero") ?? assets[0] ?? null,
    [assets]
  );

  const hasKeptCover = coverAsset ? keepAssetIds.has(coverAsset.id) : false;

  const toggleKeepAsset = (assetId: string) => {
    setKeepAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaveMessage(null);

    if (!name.trim()) {
      setError("名称不能为空");
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("价格必须是大于等于 0 的数字");
      return;
    }

    if (!coverFile && !hasKeptCover) {
      setError("请保留当前封面或上传新封面");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("description", description.trim());
      formData.set("price", priceNumber.toFixed(2));

      tagsCsv
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((tag) => formData.append("tags", tag));

      Array.from(keepAssetIds).forEach((id) => formData.append("keep_asset_ids", id));

      if (coverFile) formData.set("cover", coverFile);
      newAssetFiles.forEach((file) => formData.append("new_assets", file));

      const response = await fetchWithAuth(`/api/characters/${characterId}`, {
        method: "PUT",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail ?? "保存失败");
      }

      setSaveMessage("保存成功，正在跳转详情页...");
      setTimeout(() => {
        router.push(`/characters/${characterId}`);
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-10">加载中...</main>;
  if (error && !name) return <main className="mx-auto max-w-3xl px-6 py-10 text-red-600">{error}</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/characters/${characterId}`}>
          <Button variant="outline">返回详情</Button>
        </Link>
        <Link href="/characters">
          <Button variant="outline">角色列表</Button>
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">编辑角色</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            名称
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            描述
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            价格
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            标签（逗号分隔）
          </label>
          <input
            id="tags"
            value={tagsCsv}
            onChange={(e) => setTagsCsv(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">当前图片（可删除）</p>
          <div className="grid gap-3 md:grid-cols-2">
            {assets.map((asset) => {
              const isCover = coverAsset?.id === asset.id;
              const checked = keepAssetIds.has(asset.id);
              return (
                <label key={asset.id} className="rounded-md border p-3 text-sm">
                  {asset.url ? (
                    <img src={asset.url} alt={asset.category} className="mb-2 h-36 w-full rounded object-cover" />
                  ) : null}
                  <div className="mb-1 text-xs text-muted-foreground">{isCover ? "封面" : "附加图"}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKeepAsset(asset.id)}
                      className="h-4 w-4"
                    />
                    <span>保留该图片</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="cover" className="text-sm font-medium">
            替换封面
          </label>
          <input
            id="cover"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-assets" className="text-sm font-medium">
            新增附加图片（可多选）
          </label>
          <input
            id="new-assets"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewAssetFiles(Array.from(e.target.files ?? []))}
            className="w-full"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saveMessage ? <p className="text-sm text-green-600">{saveMessage}</p> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : "保存修改"}
        </Button>
      </form>
    </main>
  );
}

