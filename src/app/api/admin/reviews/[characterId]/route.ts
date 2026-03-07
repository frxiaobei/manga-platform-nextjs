import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, ok, unauthorized } from "@/lib/http";
import { requireAdminUser } from "@/lib/auth";
import { statusToApi } from "@/lib/mappers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> }
) {
  const admin = await requireAdminUser(request);
  if (admin === null) return unauthorized();
  if (admin === false) return forbidden();

  const { characterId } = await context.params;
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return notFound("Character not found");

  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: "character",
      entityId: character.id,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return ok({
    character: {
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
    },
    audit_logs: logs,
  });
}
