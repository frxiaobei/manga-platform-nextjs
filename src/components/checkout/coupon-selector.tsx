"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Coupon {
  id: string;
  code: string | null;
  discount_percent: number;
  expires_at: string | null;
  status: string;
}

interface CouponSelectorProps {
  coupons: Coupon[];
  onSelect: (couponId: string | null) => void;
  selectedCouponId: string | null;
}

export function CouponSelector({
  coupons,
  onSelect,
  selectedCouponId,
}: CouponSelectorProps) {
  const activeCoupons = coupons.filter((c) => c.status === "active");

  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        选择优惠券
      </label>
      <Select
        value={selectedCouponId || "none"}
        onValueChange={(value) => onSelect(value === "none" ? null : value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="请选择优惠券" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">不使用优惠券</SelectItem>
          {activeCoupons.length > 0 && (
            <SelectGroup>
              <SelectLabel>可用优惠券</SelectLabel>
              {activeCoupons.map((coupon) => (
                <SelectItem key={coupon.id} value={coupon.id}>
                  <div className="flex flex-col items-start gap-1 py-1">
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="font-medium text-foreground">
                        {coupon.code || `优惠券 ${coupon.discount_percent}% OFF`}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        -{coupon.discount_percent}%
                      </span>
                    </div>
                    {coupon.expires_at && (
                      <span className="text-[10px] text-muted-foreground">
                        有效期至: {new Date(coupon.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
