import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  if (!body?.code) {
    return NextResponse.json({ detail: "Missing authorization code" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(body.code);

  if (error || !data.session || !data.user) {
    return NextResponse.json({ detail: error?.message ?? "Google callback failed" }, { status: 400 });
  }

  return NextResponse.json(
    {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
    { status: 200 }
  );
}
