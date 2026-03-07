import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function sanitizeFileName(name: string) {
  return name.replace(/[^\w\u4e00-\u9fa5.-]+/g, "_");
}

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

export default async function PurchaseCharacterDetailPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const appUserId = await getCurrentAppUserId();

  if (!appUserId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">/me/purchases/{characterId}</p>
            <h1 className="text-2xl font-semibold">已购图片详情</h1>
          </div>
          <Link href="/me" className={buttonVariants({ variant: "outline" })}>
            返回我购买的
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">请先登录后查看已购图片。</p>
      </main>
    );
  }

  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_characterId: {
        userId: appUserId,
        characterId,
      },
    },
    include: {
      character: {
        include: {
          assets: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!purchase) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">/me/purchases/{characterId}</p>
            <h1 className="text-2xl font-semibold">已购图片详情</h1>
          </div>
          <Link href="/me" className={buttonVariants({ variant: "outline" })}>
            返回我购买的
          </Link>
        </div>
        <p className="text-sm text-destructive">该角色未购买或无权限查看完整图片。</p>
      </main>
    );
  }

  const assets = purchase.character.assets;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">/me/purchases/{characterId}</p>
          <h1 className="text-2xl font-semibold">已购图片详情</h1>
        </div>
        <Link href="/me" className={buttonVariants({ variant: "outline" })}>
          返回我购买的
        </Link>
      </div>

      <section className="space-y-4">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{purchase.character.name}</h2>
          {purchase.character.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{purchase.character.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">共 {assets.length} 张可下载图片</p>
        </div>

        {assets.length === 0 ? <p className="text-sm text-muted-foreground">暂无可展示图片。</p> : null}

        <div className="grid gap-5 md:grid-cols-2">
          {assets.map((asset, index) => (
            <article key={asset.id} className="overflow-hidden rounded-lg border bg-card text-card-foreground">
              <div className="max-h-[70vh] w-full overflow-auto bg-muted p-2">
                <img
                  src={asset.url}
                  alt={`${purchase.character.name} #${index + 1}`}
                  className="mx-auto h-auto w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="text-sm text-muted-foreground">
                  第 {index + 1} 张 · {asset.category}
                </p>
                <a
                  href={asset.url}
                  download={`${sanitizeFileName(purchase.character.name)}-${String(index + 1).padStart(2, "0")}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "sm" })}
                >
                  下载图片
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
