import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized } from "@/lib/http";
import { requireAppUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    include: {
      character: {
        include: {
          assets: {
            where: { category: "HERO" },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    purchases.map((p) => ({
      character_id: p.character.id,
      character_name: p.character.name,
      hero_image_url: p.character.assets[0]?.url ?? null,
      purchased_at: p.createdAt,
      price_paid: Number(p.pricePaid),
    }))
  );
}
