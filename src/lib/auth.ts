import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupabaseIdentity = {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  provider?: string;
};

export async function getBearerToken(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function getSupabaseIdentityFromRequest(request: NextRequest): Promise<SupabaseIdentity | null> {
  const token = await getBearerToken(request);
  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const user = data.user;
  const email = data.user.email;
  if (!email) return null;

  return {
    id: user.id,
    email,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatar: user.user_metadata?.avatar_url ?? null,
    provider: user.app_metadata?.provider,
  };
}

export async function requireAppUser(request: NextRequest) {
  const identity = await getSupabaseIdentityFromRequest(request);
  if (!identity) return null;

  return prisma.user.upsert({
    where: { supabaseId: identity.id },
    create: {
      supabaseId: identity.id,
      email: identity.email,
      name: identity.name ?? undefined,
      avatar: identity.avatar ?? undefined,
      authProvider: identity.provider ?? "supabase",
      googleSub: identity.provider === "google" ? identity.id : undefined,
    },
    update: {
      // Only update fields that are critical for auth sync
      email: identity.email,
      authProvider: identity.provider ?? "supabase",
      googleSub: identity.provider === "google" ? identity.id : undefined,
    },
  });
}

export async function requireAdminUser(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return null;
  if (user.role !== "ADMIN") return false;
  return user;
}
