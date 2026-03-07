import { NextRequest } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();
  return ok(user);
}

export async function PATCH(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  try {
    const { name, bio, avatar } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        bio,
        avatar,
      },
    });

    return ok(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return badRequest("Failed to update profile");
  }
}
