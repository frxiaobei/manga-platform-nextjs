import { NextRequest } from "next/server";
import { AssetCategory } from "@prisma/client";
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

  const isCreator = Boolean(user && user.id === character.userId);
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

  const hasFullAccess = isCreator || isPurchased;
  const lockedAssetCount = hasFullAccess
    ? 0
    : character.assets.filter((asset) => asset.category !== AssetCategory.HERO).length;

  const assets = character.assets.map((asset) => {
    const isHero = asset.category === AssetCategory.HERO;
    const isLocked = !(hasFullAccess || isHero);

    return {
      id: asset.id,
      category: assetCategoryToApi(asset.category),
      url: asset.url,
      locked: isLocked,
      is_blurred: isLocked,
      blur_note: isLocked ? "preview_blurred_for_unpurchased_user" : null,
      download_url: isPurchased ? asset.url : null,
    };
  });

  return ok({
    id: character.id,
    name: character.name,
    description: character.description,
    is_creator: isCreator,
    is_purchased: isPurchased,
    locked_asset_count: lockedAssetCount,
    assets,
  });
}
