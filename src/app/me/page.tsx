import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCurrentAppUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  return appUser?.id ?? null;
}

export default async function MePage() {
  const appUserId = await getCurrentAppUserId();

  if (!appUserId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">/me</p>
            <h1 className="text-2xl font-semibold">我购买的</h1>
          </div>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">请先登录后查看「我购买的」。</p>
      </main>
    );
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: appUserId },
    include: {
      character: {
        include: {
          assets: {
            where: { category: "HERO" },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">/me</p>
          <h1 className="text-2xl font-semibold">我购买的</h1>
        </div>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </div>

      {purchases.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无已购角色。</p>
      ) : (
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {purchases.map((purchase) => {
            const heroImage = purchase.character.assets[0]?.url ?? null;
            return (
              <Link
                key={purchase.id}
                href={`/me/purchases/${purchase.character.id}`}
                className="overflow-hidden rounded-lg border bg-card text-card-foreground transition hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full bg-muted">
                  {heroImage ? (
                    <img src={heroImage} alt={purchase.character.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">无封面</div>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <h2 className="text-base font-medium">{purchase.character.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    购买时间：{new Date(purchase.createdAt).toLocaleString("zh-CN")}
                  </p>
                  <p className="text-xs text-muted-foreground">实付：¥{Number(purchase.pricePaid).toFixed(2)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
