import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/http";
import { requireAppUser } from "@/lib/auth";
import { assetCategoryToApi } from "@/lib/mappers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> }
) {
  const { characterId } = await context.params;
  const user = await requireAppUser(request);

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });

  if (!character) return notFound("Character not found");

  let isPurchased = false;
  if (user) {
    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_characterId: {
          userId: user.id,
          characterId,
        },
      },
      select: { id: true },
    });
    isPurchased = Boolean(purchase);
  }

  const lockedAssetCount = isPurchased ? 0 : Math.max(character.assets.length - 1, 0);
  const assets = character.assets.map((asset, index) => ({
    id: asset.id,
    category: assetCategoryToApi(asset.category),
    url: isPurchased || index === 0 ? asset.url : null,
    locked: !(isPurchased || index === 0),
  }));

  return ok({
    id: character.id,
    name: character.name,
    description: character.description,
    is_purchased: isPurchased,
    locked_asset_count: lockedAssetCount,
    assets,
  });
}
