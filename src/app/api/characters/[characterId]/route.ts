import { NextRequest } from "next/server";
import { AssetCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, ok, unauthorized, unprocessable } from "@/lib/http";
import { requireAppUser } from "@/lib/auth";
import { assetCategoryToApi, splitTags } from "@/lib/mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function uploadToStorage(file: File, path: string) {
  const supabase = createSupabaseAdminClient();
  const bucket = "character-images";
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function normalizeTags(raw: FormDataEntryValue[] | null) {
  if (!raw) return [];
  const result = new Set<string>();
  for (const item of raw) {
    const value = typeof item === "string" ? item : "";
    const tag = value.trim();
    if (tag) result.add(tag);
  }
  return Array.from(result);
}

function normalizeIds(raw: FormDataEntryValue[] | null) {
  if (!raw) return [];
  const result = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (value) result.add(value);
  }
  return Array.from(result);
}

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
  const isOwner = user?.id === character.userId;
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
    isPurchased = Boolean(purchase) || isOwner;
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
    owner_id: character.userId,
    price: Number(character.price),
    status: character.status.toLowerCase(),
    tags: splitTags(character.tagsCsv),
    is_purchased: isPurchased,
    locked_asset_count: lockedAssetCount,
    assets,
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> }
) {
  const { characterId } = await context.params;
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!character) return notFound("Character not found");
  if (character.userId !== user.id) return forbidden("Only the owner can edit this character");

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const tags = normalizeTags(formData.getAll("tags"));
  const keepAssetIds = new Set(normalizeIds(formData.getAll("keep_asset_ids")));
  const cover = formData.get("cover");
  const newAssets = formData.getAll("new_assets").filter((item): item is File => item instanceof File);

  if (!name) return unprocessable("name is required");
  if (!priceRaw) return unprocessable("price is required");

  let price: Prisma.Decimal;
  try {
    price = new Prisma.Decimal(priceRaw);
  } catch {
    return unprocessable("price is invalid");
  }
  if (price.lt(0)) return unprocessable("price must be >= 0");

  const hasCoverReplacement = cover instanceof File && cover.size > 0;
  if (cover instanceof File && !cover.type.startsWith("image/")) return unprocessable("cover must be an image");
  for (const file of newAssets) {
    if (!file.type.startsWith("image/")) return unprocessable(`${file.name} must be an image`);
  }

  const heroAsset =
    character.assets.find((asset) => asset.category === AssetCategory.HERO) ?? character.assets[0] ?? null;
  const heroWillRemain = heroAsset ? keepAssetIds.has(heroAsset.id) || hasCoverReplacement : hasCoverReplacement;
  if (!heroWillRemain) {
    return unprocessable("cover image is required");
  }

  const assetsToKeep = character.assets.filter((asset) => {
    if (heroAsset && asset.id === heroAsset.id) return heroWillRemain;
    return keepAssetIds.has(asset.id);
  });
  const keepIdSet = new Set(assetsToKeep.map((asset) => asset.id));
  const deleteIds = character.assets.filter((asset) => !keepIdSet.has(asset.id)).map((asset) => asset.id);

  try {
    const basePath = `user-${user.id}/${characterId}/${Date.now()}`;
    const coverUrl = hasCoverReplacement ? await uploadToStorage(cover, `${basePath}/cover-${cover.name}`) : null;
    const newAssetUrls: string[] = [];
    for (const file of newAssets) {
      const url = await uploadToStorage(file, `${basePath}/asset-${file.name}`);
      newAssetUrls.push(url);
    }

    const updatedCharacter = await prisma.$transaction(async (tx) => {
      let heroId = heroAsset?.id ?? null;
      const heroUrl = coverUrl ?? heroAsset?.url ?? null;

      await tx.character.update({
        where: { id: characterId },
        data: {
          name,
          description: descriptionRaw || null,
          price,
          tagsCsv: tags.join(","),
          imageUrl: heroUrl,
        },
      });

      if (coverUrl) {
        if (heroAsset) {
          await tx.characterAsset.update({
            where: { id: heroAsset.id },
            data: { url: coverUrl, category: AssetCategory.HERO },
          });
        } else {
          const createdHero = await tx.characterAsset.create({
            data: {
              characterId,
              category: AssetCategory.HERO,
              url: coverUrl,
              sortOrder: 0,
            },
          });
          heroId = createdHero.id;
        }
      }

      if (deleteIds.length) {
        await tx.characterAsset.deleteMany({
          where: {
            characterId,
            id: { in: deleteIds },
          },
        });
      }

      if (newAssetUrls.length) {
        await tx.characterAsset.createMany({
          data: newAssetUrls.map((url) => ({
            characterId,
            category: AssetCategory.ASSET,
            url,
            sortOrder: 0,
          })),
        });
      }

      const finalAssets = await tx.characterAsset.findMany({
        where: { characterId },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });

      const heroFirst = heroId ? finalAssets.find((asset) => asset.id === heroId) : null;
      const others = finalAssets.filter((asset) => asset.id !== heroId);
      const orderedAssets = heroFirst ? [heroFirst, ...others] : others;

      for (let i = 0; i < orderedAssets.length; i += 1) {
        const asset = orderedAssets[i];
        await tx.characterAsset.update({
          where: { id: asset.id },
          data: {
            sortOrder: i,
            category: i === 0 ? AssetCategory.HERO : AssetCategory.ASSET,
          },
        });
      }

      return tx.character.findUniqueOrThrow({
        where: { id: characterId },
        include: { assets: { orderBy: { sortOrder: "asc" } } },
      });
    });

    return ok({
      id: updatedCharacter.id,
      name: updatedCharacter.name,
      description: updatedCharacter.description,
      price: Number(updatedCharacter.price),
      owner_id: updatedCharacter.userId,
      status: updatedCharacter.status.toLowerCase(),
      tags: splitTags(updatedCharacter.tagsCsv),
      assets: updatedCharacter.assets.map((asset) => ({
        id: asset.id,
        category: assetCategoryToApi(asset.category),
        url: asset.url,
      })),
    });
  } catch {
    return unprocessable("failed to update character");
  }
}
