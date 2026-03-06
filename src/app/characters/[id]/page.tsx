"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Character {
  id: string;
  name: string;
  description: string;
  status: string;
  price: number;
  assets: Array<{ id: string; category: string; url: string | null; locked: boolean }>;
}

interface User {
  id: string;
  role: "ADMIN" | "USER";
}

export default function CharacterDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [character, setCharacter] = useState<Character | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [charRes, userRes] = await Promise.all([
          fetch(`/api/characters/${id}`),
          fetch(`/api/auth/me`).catch(() => null),
        ]);

        if (charRes.ok) {
          const charData = await charRes.json();
          setCharacter(charData);
        }

        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleReview = async (status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES") => {
    if (status !== "APPROVED" && !reason) {
      alert("请输入审核意见/拒绝理由");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
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

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">加载中...</div>;
  if (!character) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">未找到角色</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-[#111] rounded-xl overflow-hidden border border-white/10 relative">
            {character.assets[0]?.url ? (
              <img src={character.assets[0].url} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">封面图</div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {character.assets.slice(1).map((asset, index) => (
              <div key={asset.id} className="aspect-square bg-[#111] rounded-lg overflow-hidden border border-white/5 relative">
                {asset.url ? (
                  <img src={asset.url} alt={`${character.name} asset ${index + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-gray-600">
                    {asset.locked ? "已锁定" : "无图"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{character.name}</h1>
            <p className="text-gray-400 leading-relaxed">{character.description || "暂无描述"}</p>
          </div>

          <div className="p-4 bg-[#111] rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 mb-1">价格</div>
            <div className="text-2xl font-bold text-[#f97316]">¥ {character.price || 0}</div>
          </div>

          {/* Admin Review Panel */}
          {user?.role === "ADMIN" && (
            <div className="mt-8 p-6 bg-[#1a1a1a] rounded-xl border border-[#f97316]/20 space-y-4">
              <h3 className="text-lg font-semibold text-[#f97316]">管理员审核</h3>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">审核意见 / 理由 (拒绝或需修改时必填)</label>
                <textarea
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                  placeholder="请输入理由..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => handleReview("APPROVED")} 
                  disabled={reviewLoading}
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  通过
                </Button>
                <Button 
                  onClick={() => handleReview("NEEDS_CHANGES")} 
                  disabled={reviewLoading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                >
                  需修改
                </Button>
                <Button 
                  onClick={() => handleReview("REJECTED")} 
                  disabled={reviewLoading}
                  className="bg-red-600 hover:bg-red-700 text-xs"
                >
                  拒绝
                </Button>
              </div>
            </div>
          )}

          <Button className="w-full bg-white text-black hover:bg-gray-200 py-6 rounded-xl font-bold">
            立即购买
          </Button>
        </div>
      </div>
    </div>
  );
}
