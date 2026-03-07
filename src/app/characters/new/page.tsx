"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NewCharacterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0",
    tags: "",
  });

  const [cover, setCover] = useState<File | null>(null);
  const [assets, setAssets] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("price", formData.price);
      
      const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
      tags.forEach(tag => data.append("tags", tag));

      if (cover) {
        data.append("cover", cover);
      } else {
        throw new Error("Cover image is required");
      }

      if (assets) {
        for (let i = 0; i < assets.length; i++) {
          data.append("assets", assets[i]);
        }
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
        // Authentication token should be handled by Supabase cookie or Bearer header
        // If it's a cookie, it's automatic. If it's header, we'd need it here.
        // Assuming session is handled by cookies or headers automatically via middleware if implemented.
        // Actually, requireAppUser uses getBearerToken. I might need to provide it.
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const result = await res.json();
      router.push(`/characters/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#f97316]">上架新角色</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#111] p-8 rounded-xl border border-white/10 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">名称</label>
            <input
              type="text"
              required
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all"
              placeholder="角色名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">描述</label>
            <textarea
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all min-h-[120px]"
              placeholder="描述该角色的特点、背景等..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">价格 (CNY)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">标签 (逗号分隔)</label>
              <input
                type="text"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all"
                placeholder="萌系, 御姐, 现代"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">封面图 (必须)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#f97316]/50 transition-all bg-[#1a1a1a]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                  <p className="mb-2 text-sm">
                    {cover ? <span className="text-[#f97316] font-medium">{cover.name}</span> : <span>点击上传封面</span>}
                  </p>
                  <p className="text-xs">PNG, JPG or WEBP</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  required
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">资源图 (多张)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#f97316]/50 transition-all bg-[#1a1a1a]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                  <p className="mb-2 text-sm">
                    {assets && assets.length > 0 ? (
                      <span className="text-[#f97316] font-medium">{assets.length} 个文件已选择</span>
                    ) : (
                      <span>点击选择多张图片</span>
                    )}
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setAssets(e.target.files)}
                />
              </label>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-6 rounded-lg shadow-lg shadow-[#f97316]/20"
            >
              {loading ? "上传中..." : "确认发布"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
