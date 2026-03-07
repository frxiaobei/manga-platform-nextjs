import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { badRequest, ok, unauthorized } from "@/lib/http";

const MAX_NICKNAME_LENGTH = 30;
const MAX_BIO_LENGTH = 200;

export async function GET(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized("请先登录后查看个人资料");

  return ok({
    id: user.id,
    email: user.email,
    nickname: user.name ?? "",
    bio: user.bio ?? "",
    avatar: user.avatar,
    updatedAt: user.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized("请先登录后编辑个人资料");

  const body = (await request.json().catch(() => null)) as { nickname?: string; bio?: string } | null;
  if (!body) return badRequest("请求格式错误");

  const nickname = String(body.nickname ?? "").trim();
  const bio = String(body.bio ?? "").trim();

  if (!nickname) return badRequest("昵称不能为空");
  if (nickname.length > MAX_NICKNAME_LENGTH) return badRequest(`昵称不能超过 ${MAX_NICKNAME_LENGTH} 个字符`);
  if (bio.length > MAX_BIO_LENGTH) return badRequest(`简介不能超过 ${MAX_BIO_LENGTH} 个字符`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: nickname,
      bio: bio || null,
    },
  });

  return ok({
    id: updated.id,
    email: updated.email,
    nickname: updated.name ?? "",
    bio: updated.bio ?? "",
    avatar: updated.avatar,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
