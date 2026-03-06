import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { slugifyTag, splitTags } from "@/lib/mappers";

export async function GET() {
  const characters = await prisma.character.findMany({
    where: { status: "APPROVED" },
    select: { tagsCsv: true },
  });

  const tagSet = new Set<string>();
  for (const row of characters) {
    for (const tag of splitTags(row.tagsCsv)) tagSet.add(tag);
  }

  const tags = Array.from(tagSet)
    .sort((a, b) => a.localeCompare(b))
    .map((name, index) => ({
      id: index + 1,
      name,
      slug: slugifyTag(name),
    }));

  return ok(tags);
}
