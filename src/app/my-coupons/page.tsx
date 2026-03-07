"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string | null;
  discount_percent: number;
  status: "active" | "used" | "expired";
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("active");
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const fetchCoupons = async (currentStatus: string) => {
    setLoading(true);
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/coupons/my?status=${currentStatus}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else if (res.status === 401) {
        // Unauthorized
        setCoupons([]);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchCoupons(status);
      } else {
        setLoading(false);
      }
    };
    checkSessionAndFetch();
  }, [status]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return "-";
    }

    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">我的优惠券</h1>
        <Button variant="outline" onClick={() => router.push("/")}>
          返回首页
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="active">可用</TabsTrigger>
          <TabsTrigger value="used">已用</TabsTrigger>
          <TabsTrigger value="expired">过期</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="space-y-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              加载中...
            </div>
          ) : coupons.length === 0 ? (
            <Card className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <p>
                {status === "active" ? "暂无可用优惠券" : status === "used" ? "暂无已用记录" : "暂无过期优惠券"}
              </p>
              <Button variant="outline" className="mt-2" onClick={() => router.push("/")}>
                去选购角色
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className={status !== "active" ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-4xl font-bold text-primary">
                          {coupon.discount_percent}%
                          <span className="text-sm font-normal text-muted-foreground"> OFF</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {coupon.code ? `代码: ${coupon.code}` : "自动抵扣"}
                        </CardDescription>
                      </div>
                      <Badge variant={status === "active" ? "default" : "secondary"}>
                        {status === "active" ? "可用" : status === "used" ? "已用" : "过期"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>有效期至:</span>
                        <span>{formatDate(coupon.expires_at)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>使用规则:</span>
                        <span>全场通用</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {status === "active" && (
                      <Button className="w-full" onClick={() => router.push("/")}>
                        立即使用
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
