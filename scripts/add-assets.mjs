import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const characterId = 'cmmf3joui0001stj0pb1qf5vb';
  
  // 添加图片 (CharacterAsset) - 只有 category, url, sortOrder
  await prisma.characterAsset.create({
    data: { characterId, category: 'HERO', url: 'https://picsum.photos/seed/elsa1/800/1200', sortOrder: 0 }
  });
  await prisma.characterAsset.create({
    data: { characterId, category: 'ASSET', url: 'https://picsum.photos/seed/elsa2/800/1200', sortOrder: 1 }
  });
  await prisma.characterAsset.create({
    data: { characterId, category: 'ASSET', url: 'https://picsum.photos/seed/elsa3/800/1200', sortOrder: 2 }
  });
  console.log('图片添加成功');

  // 添加标签
  const tags = ['奇幻', '女王', '冰雪', '高贵'];
  for (const tagName of tags) {
    let tag = await prisma.tag.findFirst({ where: { name: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
    }
    await prisma.characterTag.create({ data: { characterId, tagId: tag.id } });
  }
  console.log('标签添加成功');
  console.log('✅ 完成!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
