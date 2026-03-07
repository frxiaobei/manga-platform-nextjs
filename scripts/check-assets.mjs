import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.characterAsset.findMany({
    include: { character: { select: { name: true } } },
    orderBy: { sortOrder: 'asc' }
  });
  
  console.log("=== 角色图片 ===");
  const grouped = {};
  for (const a of assets) {
    const name = a.character?.name || a.characterId;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push({ category: a.category, url: a.url.substring(0, 50) + "...", order: a.sortOrder });
  }
  
  for (const [name, items] of Object.entries(grouped)) {
    console.log(`\n【${name}】${items.length} 张图片：`);
    items.forEach((i, idx) => console.log(`  ${idx+1}. [${i.category}] order=${i.order}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
