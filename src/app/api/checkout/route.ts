import Stripe from "stripe";
import { CouponStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, notFound, ok, serverError, unauthorized, unprocessable } from "@/lib/http";
import { requireAppUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return serverError("Stripe is not configured");

  const body = (await request.json().catch(() => null)) as
    | {
        character_id?: string;
        success_url?: string;
        cancel_url?: string;
        couponId?: string | null;
        coupon_id?: string | null;
      }
    | null;

  if (!body?.character_id || !body.success_url || !body.cancel_url) {
    return unprocessable("character_id, success_url, cancel_url are required");
  }

  const character = await prisma.character.findUnique({ where: { id: body.character_id } });
  if (!character) return notFound("Character not found");
  if (character.status !== "APPROVED") return unprocessable("Character is not purchasable");

  const existingPurchase = await prisma.purchase.findUnique({
    where: {
      userId_characterId: { userId: user.id, characterId: character.id },
    },
    select: { id: true },
  });
  if (existingPurchase) return conflict("Already purchased");

  const couponId = body.couponId ?? body.coupon_id ?? null;
  let discountPercent = 0;
  if (couponId) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId: user.id,
        status: CouponStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        discountPercent: true,
      },
    });
    if (!coupon) return unprocessable("Coupon is invalid or unavailable");
    discountPercent = coupon.discountPercent;
  }

  const stripe = new Stripe(stripeSecret);
  const originalUnitAmount = Math.round(Number(character.price) * 100);
  const unitAmount = Math.max(1, Math.round(originalUnitAmount * (100 - discountPercent) / 100));
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: body.success_url,
    cancel_url: body.cancel_url,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: { name: `角色购买：${character.name}` },
        },
      },
    ],
    metadata: {
      user_id: user.id,
      character_id: character.id,
      coupon_id: couponId ?? "",
      discount_percent: String(discountPercent),
      price_cents: String(unitAmount),
      original_price_cents: String(originalUnitAmount),
    },
  });

  if (!session.url) return serverError("Stripe session missing checkout url");

  return ok({
    checkout_url: session.url,
    session_id: session.id,
  });
}
