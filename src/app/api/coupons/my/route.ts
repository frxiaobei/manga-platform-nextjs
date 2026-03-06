import { NextRequest } from "next/server";
import { CouponStatus } from "@prisma/client";
import { requireAppUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { couponStatusToApi } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status")?.toUpperCase() as keyof typeof CouponStatus | null;
  const status = statusParam && CouponStatus[statusParam] ? CouponStatus[statusParam] : undefined;

  const coupons = await prisma.coupon.findMany({
    where: {
      userId: user.id,
      status,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return ok(
    coupons.map((coupon) => ({
      id: coupon.id,
      user_id: coupon.userId,
      code: coupon.code,
      discount_percent: coupon.discountPercent,
      source_type: coupon.sourceType,
      source_id: coupon.sourceId,
      status: couponStatusToApi(coupon.status),
      used_at: coupon.usedAt,
      expires_at: coupon.expiresAt,
      created_at: coupon.createdAt,
    }))
  );
}
