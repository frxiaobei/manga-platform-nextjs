import { Button } from "@/components/ui/button";

export function PageShell() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center gap-4 px-6 py-20">
      <p className="text-sm text-muted-foreground">Manga Platform (Next.js)</p>
      <h1 className="text-3xl font-semibold tracking-tight">迁移基础已完成</h1>
      <p className="text-muted-foreground">Prisma + Supabase Auth/Storage + API Routes + shadcn/ui 已接入。</p>
      <Button>Explore API</Button>
    </main>
  );
}
