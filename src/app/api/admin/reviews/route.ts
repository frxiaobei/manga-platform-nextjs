import { NextRequest } from "next/server";
import { CharacterStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { forbidden, ok, unauthorized } from "@/lib/http";
import { requireAdminUser } from "@/lib/auth";
import { statusToApi } from "@/lib/mappers";

export async function GET(request: NextRequest) {
  const admin = await requireAdminUser(request);
  if (admin === null) return unauthorized();
  if (admin === false) return forbidden();

  const { searchParams } = new URL(request.url);
  const statusParam = (searchParams.get("status") ?? "pending").toUpperCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 100);
  const cursor = searchParams.get("cursor");

  const status = CharacterStatus[statusParam as keyof typeof CharacterStatus] ?? CharacterStatus.PENDING;

  const rows = await prisma.character.findMany({
    where: {
      status,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit,
  });

  const nextCursor = rows.length === limit ? rows[rows.length - 1]?.id : null;

  return ok({
    items: rows.map((item) => ({
      id: item.id,
      title: item.name,
      description: item.description,
      status: statusToApi(item.status),
      owner_id: item.userId,
      review_reason: item.reviewReason,
      published_at: item.publishedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      price: Number(item.price),
    })),
    next_cursor: nextCursor,
  });
}
