import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ detail: "Email and password are required" }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ detail: error?.message ?? "Register failed" }, { status: 400 });
  }

  const profile = await prisma.user.upsert({
    where: { supabaseId: data.user.id },
    create: {
      supabaseId: data.user.id,
      email,
      name: (data.user.user_metadata?.full_name as string | undefined) ?? undefined,
      avatar: (data.user.user_metadata?.avatar_url as string | undefined) ?? undefined,
      authProvider: "password",
    },
    update: { email, authProvider: "password" },
  });

  return NextResponse.json({ user: profile }, { status: 201 });
}
