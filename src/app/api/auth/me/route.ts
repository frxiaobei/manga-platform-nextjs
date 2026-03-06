import { NextRequest } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await requireAppUser(request);
  if (!user) return unauthorized();
  return ok(user);
}
