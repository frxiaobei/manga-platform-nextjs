import { NextRequest } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { notFound, ok, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { couponStatusToApi } from "@/lib/mappers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ couponId: string }> }
) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const { couponId } = await context.params;
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon || coupon.userId !== user.id) return notFound("Coupon not found");

  return ok({
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
  });
}
