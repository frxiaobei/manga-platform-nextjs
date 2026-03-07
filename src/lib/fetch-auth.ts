"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
  const supabase = getSupabaseBrowserClient();
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
