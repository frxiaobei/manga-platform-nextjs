import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { badRequest, ok, serverError, unauthorized, unprocessable } from "@/lib/http";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_BUCKET = "character-images";

function getAvatarExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return null;
}

export async function POST(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized("请先登录后上传头像");

  const formData = await request.formData();
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File)) return badRequest("请上传头像图片");
  if (!avatar.type.startsWith("image/")) return unprocessable("头像必须是图片文件");
  if (avatar.size > MAX_AVATAR_SIZE_BYTES) return unprocessable("头像大小不能超过 5MB");

  const extension = getAvatarExtension(avatar.type);
  if (!extension) return unprocessable("头像格式仅支持 JPG、PNG、WEBP");

  const fileBuffer = await avatar.arrayBuffer();
  const key = `user-${user.id}/avatars/avatar-${Date.now()}.${extension}`;

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(key, fileBuffer, {
      contentType: avatar.type,
      upsert: false,
    });
    if (error) return serverError(`头像上传失败: ${error.message}`);

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(key);
    const avatarUrl = data.publicUrl;

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    return ok({ avatar: avatarUrl });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "头像上传失败");
  }
}
