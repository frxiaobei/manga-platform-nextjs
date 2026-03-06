"use client";

import * as React from "react";
import { CouponSelector, type Coupon } from "@/components/checkout/coupon-selector";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Mock character data for demonstration
const MOCK_CHARACTER = {
  id: "char_123",
  name: "星野爱 (Hoshino Ai)",
  price: 299.00,
  description: "来自《我推的孩子》的高人气角色模型。",
};

export default function CheckoutPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchCoupons() {
      try {
        const response = await fetch("/api/coupons/my?status=active");
        if (response.ok) {
          const data = await response.json();
          setCoupons(data);
        }
      } catch (error) {
        console.error("Failed to fetch coupons", error);
      }
    }

    fetchCoupons();
  }, []);

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId);
  const discountAmount = selectedCoupon 
    ? (MOCK_CHARACTER.price * selectedCoupon.discount_percent) / 100 
    : 0;
  const finalPrice = MOCK_CHARACTER.price - discountAmount;

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>确认订单</CardTitle>
          <CardDescription>请核对您的购买信息并选择优惠券</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{MOCK_CHARACTER.name}</p>
              <p className="text-sm text-muted-foreground">{MOCK_CHARACTER.description}</p>
            </div>
            <p className="text-lg font-semibold">¥{MOCK_CHARACTER.price.toFixed(2)}</p>
          </div>

          <Separator />

          <CouponSelector 
            coupons={coupons} 
            selectedCouponId={selectedCouponId} 
            onSelect={setSelectedCouponId} 
          />

          <Separator />

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">商品原价</span>
              <span>¥{MOCK_CHARACTER.price.toFixed(2)}</span>
            </div>
            {selectedCoupon && (
              <div className="flex justify-between text-sm text-primary">
                <span>优惠券折扣 ({selectedCoupon.discount_percent}%)</span>
                <span>-¥{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>应付总额</span>
              <span className="text-xl">¥{finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg">
            去支付
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
