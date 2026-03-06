import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, ok, unauthorized, unprocessable } from "@/lib/http";
import { requireAdminUser } from "@/lib/auth";
import { statusToApi } from "@/lib/mappers";
import { CharacterStatus } from "@prisma/client";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ characterId: string }> }
) {
  const admin = await requireAdminUser(request);
  if (admin === null) return unauthorized();
  if (admin === false) return forbidden();

  const { characterId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    status: CharacterStatus;
    reason?: string;
  } | null;

  if (!body?.status) return unprocessable("Status is required");

  const allowedStatuses: CharacterStatus[] = ["APPROVED", "REJECTED", "NEEDS_CHANGES"];
  if (!allowedStatuses.includes(body.status)) {
    return unprocessable(`Invalid status: ${body.status}`);
  }

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return notFound("Character not found");

  const updateData: {
    status: CharacterStatus;
    reviewReason: string | null;
    publishedAt?: Date | null;
  } = {
    status: body.status,
    reviewReason: body.reason || null,
  };

  if (body.status === "APPROVED") {
    updateData.publishedAt = new Date();
  } else {
    updateData.publishedAt = null;
  }

  const updated = await prisma.character.update({
    where: { id: characterId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: `character.review.${body.status.toLowerCase()}`,
      entityType: "character",
      entityId: characterId,
      detail: body.reason || body.status.toLowerCase(),
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
