import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, created, notFound, unauthorized, unprocessable } from "@/lib/http";
import { requireAppUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> }
) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const { characterId } = await context.params;
  const body = (await request.json().catch(() => null)) as { score?: number } | null;
  const score = body?.score;
  if (!score || score < 1 || score > 5) {
    return unprocessable("score must be between 1 and 5");
  }

  const character = await prisma.character.findUnique({ where: { id: characterId }, select: { id: true } });
  if (!character) return notFound("Character not found");

  const rating = await prisma.rating.upsert({
    where: {
      userId_characterId: {
        userId: user.id,
        characterId,
      },
    },
    create: {
      userId: user.id,
      characterId,
      score,
    },
    update: { score },
  });

  const coupon = await prisma.coupon.upsert({
    where: {
      code: `RATING-${user.id}-${rating.id}`,
    },
    create: {
      userId: user.id,
      code: `RATING-${user.id}-${rating.id}`,
      discountPercent: 30,
      sourceType: "rating",
      sourceId: rating.id,
      status: "ACTIVE",
    },
    update: {},
  }).catch(() => null);

  if (!coupon) return conflict("Failed to create rating coupon");

  return created({
    rating_id: rating.id,
    coupon_id: coupon.id,
    discount_percent: coupon.discountPercent,
  });
}
