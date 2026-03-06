import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, forbidden, notFound, ok, unauthorized } from "@/lib/http";
import { requireAdminUser } from "@/lib/auth";
import { statusToApi } from "@/lib/mappers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> }
) {
  const admin = await requireAdminUser(request);
  if (admin === null) return unauthorized();
  if (admin === false) return forbidden();

  const { characterId } = await context.params;
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return notFound("Character not found");
  if (character.status !== "PENDING") return conflict("Only pending characters can be approved");

  const updated = await prisma.character.update({
    where: { id: characterId },
    data: {
      status: "APPROVED",
      reviewReason: null,
      publishedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "character.review.approved",
      entityType: "character",
      entityId: characterId,
      detail: "approved",
    },
  });

  return ok({
    id: updated.id,
    title: updated.name,
    description: updated.description,
    status: statusToApi(updated.status),
    owner_id: updated.userId,
    review_reason: updated.reviewReason,
    published_at: updated.publishedAt,
    created_at: updated.createdAt,
    updated_at: updated.updatedAt,
    price: Number(updated.price),
  });
}
