import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { ok, serverError, unauthorized, unprocessable } from "@/lib/http";

export const runtime = "nodejs";

async function uploadToStorage(file: Blob, path: string) {
  const supabase = createSupabaseAdminClient();
  const bucket = "character-images";
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof Blob)) {
    return unprocessable("Avatar file is required");
  }

  try {
    const path = `avatars/user-${user.id}-${Date.now()}.jpg`;
    const avatarUrl = await uploadToStorage(file, path);

    // Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    return ok({ avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return serverError("Failed to upload avatar");
  }
}
