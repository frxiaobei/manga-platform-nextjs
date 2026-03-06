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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    return NextResponse.json({ detail: error?.message ?? "Invalid email or password" }, { status: 401 });
  }

  const profile = await prisma.user.upsert({
    where: { supabaseId: data.user.id },
    create: {
      supabaseId: data.user.id,
      email,
      name: (data.user.user_metadata?.full_name as string | undefined) ?? undefined,
      avatar: (data.user.user_metadata?.avatar_url as string | undefined) ?? undefined,
      authProvider: (data.user.app_metadata?.provider as string | undefined) ?? "password",
      googleSub: data.user.app_metadata?.provider === "google" ? data.user.id : undefined,
    },
    update: {
      email,
      authProvider: (data.user.app_metadata?.provider as string | undefined) ?? "password",
    },
  });

  return NextResponse.json(
    {
      user: profile,
      token: data.session.access_token,
    },
    { status: 200 }
  );
}
