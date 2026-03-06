import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { assetCategoryToApi, slugifyTag, splitTags, statusToApi } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const tags = searchParams.get("tags")?.trim() ?? "";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const sort = searchParams.get("sort") ?? "latest";
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") ?? "20");

  const where: Prisma.CharacterWhereInput = { status: "APPROVED" };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (minPrice || maxPrice) {
    where.price = {
      gte: minPrice ? new Prisma.Decimal(minPrice) : undefined,
      lte: maxPrice ? new Prisma.Decimal(maxPrice) : undefined,
    };
  }
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const characters = await prisma.character.findMany({
    where,
    include: {
      assets: { orderBy: { sortOrder: "asc" } },
      ratings: { select: { id: true } },
    },
    orderBy:
      sort === "price"
        ? { price: "desc" }
        : sort === "hot"
          ? { ratings: { _count: "desc" } }
          : { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100) + 1,
  });

  const requestedTags = tags
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(slugifyTag);

  const filtered = requestedTags.length
    ? characters.filter((character) => {
        const current = new Set(splitTags(character.tagsCsv).map(slugifyTag));
        return requestedTags.every((tag) => current.has(tag));
      })
    : characters;

  const items = filtered.slice(0, limit);
  const nextCursor = filtered.length > limit ? items[items.length - 1]?.createdAt.toISOString() : null;

  return ok({
    items: items.map((character) => ({
      id: character.id,
      title: character.name,
      description: character.description,
      status: statusToApi(character.status),
      owner_id: character.userId,
      review_reason: character.reviewReason,
      published_at: character.publishedAt,
      created_at: character.createdAt,
      updated_at: character.updatedAt,
      price: Number(character.price),
      hot_score: character.ratings.length,
      tags: splitTags(character.tagsCsv).map((name, index) => ({
        id: index + 1,
        name,
        slug: slugifyTag(name),
      })),
      assets: character.assets.map((asset) => ({
        id: asset.id,
        category: assetCategoryToApi(asset.category),
        url: asset.url,
        nsfw_score: null,
        is_high_risk: false,
      })),
    })),
    next_cursor: nextCursor,
  });
}
