import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ResetPasswordBody = {
  password?: string;
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return NextResponse.json({ detail: "缺少认证信息" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ResetPasswordBody | null;
  const password = body?.password;

  if (!password || password.length < 8) {
    return NextResponse.json({ detail: "密码至少 8 位" }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ detail: error?.message ?? "认证已失效" }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
    password,
  });

  if (updateError) {
    return NextResponse.json({ detail: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ message: "密码更新成功" }, { status: 200 });
}
