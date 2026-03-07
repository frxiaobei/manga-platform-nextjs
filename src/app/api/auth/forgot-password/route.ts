import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ForgotPasswordBody = {
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRedirectUrl(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/reset-password`;
  }

  return `${request.nextUrl.origin}/reset-password`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ForgotPasswordBody | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ detail: "请输入有效邮箱" }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl(request),
  });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { message: "如果邮箱存在，我们已发送重置链接，请检查邮箱。" },
    { status: 200 }
  );
}
