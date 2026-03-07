"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CharacterItem = {
  id: string;
  title: string;
  price: number;
};

type CouponItem = {
  id: string;
  code: string | null;
  discount_percent: number;
};

type CharacterListResponse = {
  items: CharacterItem[];
};

export function PageShell() {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [characterRes, couponRes] = await Promise.all([
          fetch("/api/characters?limit=50", { cache: "no-store" }),
          fetch("/api/coupons/my?status=active", { cache: "no-store" }),
        ]);

        if (!characterRes.ok) throw new Error("获取角色失败");

        const characterJson = (await characterRes.json()) as CharacterListResponse;
        const couponJson = couponRes.ok ? ((await couponRes.json()) as CouponItem[]) : [];

        setCharacters(characterJson.items ?? []);
        setCoupons(couponJson ?? []);
        setSelectedCharacterId((characterJson.items ?? [])[0]?.id ?? "");
      } catch {
        setError("加载数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const selectedCharacter = useMemo(
    () => characters.find((item) => item.id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId]
  );

  const selectedCoupon = useMemo(
    () => coupons.find((item) => item.id === selectedCouponId) ?? null,
    [coupons, selectedCouponId]
  );

  const originalPrice = selectedCharacter?.price ?? 0;
  const discountPercent = selectedCoupon?.discount_percent ?? 0;
  const discountAmount = Number((originalPrice * discountPercent / 100).toFixed(2));
  const finalPrice = Number(Math.max(0, originalPrice - discountAmount).toFixed(2));
  const currencyFormatter = new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "USD",
  });

  const onPay = async () => {
    if (!selectedCharacterId) return;
    setPaying(true);
    setError("");
    try {
      const payload = {
        character_id: selectedCharacterId,
        couponId: selectedCoupon?.id ?? null,
        success_url: `${window.location.origin}/?payment=success`,
        cancel_url: `${window.location.origin}/?payment=cancelled`,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { checkout_url?: string; detail?: string };

      if (!res.ok || !json.checkout_url) {
        throw new Error(json.detail ?? "创建支付失败");
      }

      window.location.href = json.checkout_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建支付失败";
      setError(message);
      setPaying(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Manga Checkout</p>
          <h1 className="text-3xl font-semibold tracking-tight">支付页选优惠券</h1>
        </div>
        <Link href="/me">
          <Button variant="outline">进入我的购买</Button>
        </Link>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}

        {!loading ? (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="character-select">
                选择角色
              </label>
              <select
                id="character-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedCharacterId}
                onChange={(event) => setSelectedCharacterId(event.target.value)}
              >
                {characters.length === 0 ? <option value="">暂无可购买角色</option> : null}
                {characters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({currencyFormatter.format(item.price)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="coupon-select">
                选择优惠券
              </label>
              <select
                id="coupon-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedCouponId}
                onChange={(event) => setSelectedCouponId(event.target.value)}
              >
                <option value="">不使用优惠券</option>
                {coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {(coupon.code ?? coupon.id.slice(0, 8)).toUpperCase()} (-{coupon.discount_percent}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="flex justify-between">
                <span>原价</span>
                <span>{currencyFormatter.format(originalPrice)}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span>优惠</span>
                <span>-{currencyFormatter.format(discountAmount)}</span>
              </p>
              <p className="mt-3 flex justify-between text-base font-semibold">
                <span>应付金额</span>
                <span>{currencyFormatter.format(finalPrice)}</span>
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button disabled={!selectedCharacterId || paying} onClick={onPay}>
              {paying ? "跳转支付中..." : "立即支付"}
            </Button>
          </>
        ) : null}
      </section>
    </main>
  );
}
