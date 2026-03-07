import Stripe from "stripe";
import { CouponStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return Response.json({ detail: "Stripe webhook is not configured" }, { status: 500 });
  }

  const stripeSignature = request.headers.get("stripe-signature");
  if (!stripeSignature) {
    return Response.json({ detail: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, stripeSignature, webhookSecret);
  } catch {
    return Response.json({ detail: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return Response.json({ received: true }, { status: 200 });
  }

  const userId = session.metadata?.user_id;
  const characterId = session.metadata?.character_id;
  const couponId = session.metadata?.coupon_id?.trim() || null;
  const priceCents = session.amount_total ?? Number(session.metadata?.price_cents ?? 0);

  if (!userId || !characterId || !priceCents || priceCents <= 0) {
    return Response.json({ received: true }, { status: 200 });
  }

  const exists = await prisma.purchase.findUnique({
    where: {
      userId_characterId: { userId, characterId },
    },
    select: { id: true },
  });

  if (!exists) {
    await prisma.$transaction(async (tx) => {
      await tx.purchase.create({
        data: {
          userId,
          characterId,
          pricePaid: new Prisma.Decimal(priceCents).div(100),
          couponId: couponId ?? undefined,
        },
      });

      if (couponId) {
        await tx.coupon.updateMany({
          where: {
            id: couponId,
            userId,
            status: CouponStatus.ACTIVE,
          },
          data: {
            status: CouponStatus.USED,
            usedAt: new Date(),
          },
        });
      }
    }).catch(() => null);
  }

  return Response.json({ received: true }, { status: 200 });
}
