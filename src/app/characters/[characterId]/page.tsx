import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Lock, ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PageProps {
  params: Promise<{ characterId: string }>;
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const { characterId } = await params;

  // 1. Fetch character with assets
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      assets: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!character) {
    notFound();
  }

  // 2. Auth & Purchase check
  let isPurchased = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (supabaseUser) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: supabaseUser.id },
        select: { id: true }
      });

      if (dbUser) {
        const purchase = await prisma.purchase.findUnique({
          where: {
            userId_characterId: {
              userId: dbUser.id,
              characterId: characterId,
            },
          },
        });
        isPurchased = !!purchase;
      }
    }
  } catch (error) {
    console.error("Auth check failed:", error);
  }

  const heroAsset = character.imageUrl;
  const assets = character.assets;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center text-zinc-400 hover:text-orange-500 transition-colors">
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span>Back to Browse</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[65vh] w-full overflow-hidden border-b border-zinc-800">
        {heroAsset ? (
          <Image
            src={heroAsset}
            alt={character.name}
            fill
            className="object-cover object-top"
            priority
            unoptimized // Bypass next/image external domain checks for now
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500 text-lg uppercase tracking-widest font-bold">
            No Hero Asset
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              {character.name}
            </h1>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              {character.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {!isPurchased && (
                <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none h-12 px-8 text-base font-semibold shadow-lg shadow-orange-500/20 rounded-lg">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Unlock Resources for ${character.price.toString()}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Character Resources</h2>
            <p className="mt-2 text-zinc-500">
              High-resolution assets including poses, expressions, and costumes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
              {assets.length} Assets
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset, index) => {
            // Requirement: Hero is normal, resources are blurred if not purchased.
            // Assuming first asset is free or Hero is handled separately.
            // If the user hasn't purchased, we blur everything except maybe the very first one.
            const isLocked = !isPurchased && index > 0; 
            const label = getAssetLabel(asset.category);

            return (
              <div
                key={asset.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 transition-all hover:border-orange-500/40"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
                  <Image
                    src={asset.url}
                    alt={label}
                    fill
                    className={`object-cover transition-all duration-700 ${
                      isLocked 
                        ? "blur-2xl scale-110 grayscale brightness-75" 
                        : "group-hover:scale-110"
                    }`}
                    unoptimized // Bypass next/image external domain checks for now
                  />
                  
                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity group-hover:opacity-90">
                      <div className="rounded-2xl bg-orange-500 p-4 shadow-2xl shadow-orange-500/30">
                        <Lock className="h-8 w-8 text-white" fill="white" />
                      </div>
                      <span className="mt-4 text-xs font-bold text-white uppercase tracking-[0.2em]">Locked Resource</span>
                    </div>
                  )}
                  
                  {/* Category Label */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-bold text-orange-500 backdrop-blur-md border border-zinc-800">
                      {label}
                    </span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight">
                      {label} Asset
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                      {asset.category}
                    </span>
                  </div>
                  {!isLocked && (
                    <div className="text-orange-500 bg-orange-500/10 p-2 rounded-lg">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getAssetLabel(category: string) {
  const labels: Record<string, string> = {
    HERO: "封面封面",
    EXPRESSION: "精细表情",
    TURNAROUND: "多角度视图",
    COSTUME: "限定服装",
    OTHER: "资源资产",
    ASSET: "全身详情", // "全身" as requested
  };
  return labels[category] || category;
}
