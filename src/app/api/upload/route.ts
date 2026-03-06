import { NextRequest } from "next/server";
import { AssetCategory, Prisma } from "@prisma/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { created, serverError, unauthorized, unprocessable } from "@/lib/http";

export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "0").trim();
  const cover = formData.get("cover");
  const assets = formData.getAll("assets").filter((item): item is File => item instanceof File);
  const tags = normalizeTags(formData.getAll("tags"));

  if (!name) return unprocessable("name is required");
  if (!(cover instanceof File) || !cover.type.startsWith("image/")) return unprocessable("cover must be an image");

  const price = new Prisma.Decimal(priceRaw || "0");
  if (price.lt(0)) return unprocessable("price must be >= 0");

  await prisma.uploadEvent.create({
    data: {
      userId: user.id,
      eventType: "upload_started",
    },
  });

  try {
    const basePath = `user-${user.id}/${Date.now()}`;
    const coverUrl = await uploadToStorage(cover, `${basePath}/cover-${cover.name}`);

    const assetUrls: string[] = [];
    for (const file of assets) {
      if (!file.type.startsWith("image/")) return unprocessable(`${file.name} must be an image`);
      const url = await uploadToStorage(file, `${basePath}/${file.name}`);
      assetUrls.push(url);
    }

    const character = await prisma.character.create({
      data: {
        name,
        description: descriptionRaw || null,
        status: "PENDING",
        price,
        tagsCsv: tags.join(","),
        userId: user.id,
        imageUrl: coverUrl,
      },
    });

    await prisma.characterAsset.create({
      data: {
        characterId: character.id,
        category: AssetCategory.HERO,
        url: coverUrl,
        sortOrder: 0,
      },
    });

    if (assetUrls.length) {
      await prisma.characterAsset.createMany({
        data: assetUrls.map((url, index) => ({
          characterId: character.id,
          category: AssetCategory.ASSET,
          url,
          sortOrder: index + 1,
        })),
      });
    }

    await prisma.uploadEvent.create({
      data: {
        userId: user.id,
        characterId: character.id,
        eventType: "upload_success",
      },
    });

    return created({
      id: character.id,
      name: character.name,
      description: character.description,
      status: "pending",
      price: Number(character.price),
      tags,
      cover: coverUrl,
      assets: assetUrls.map((url) => ({ category: "asset", url })),
    });
  } catch (error) {
    await prisma.uploadEvent.create({
      data: {
        userId: user.id,
        eventType: "upload_failed",
        reason: error instanceof Error ? error.message : "upload_failed",
      },
    });
    return serverError("failed to upload image");
  }
}
