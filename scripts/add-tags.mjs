import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const characterId = 'cmmf3joui0001stj0pb1qf5vb';

  const tags = [
    { name: '奇幻', slug: 'fantasy' },
    { name: '女王', slug: 'queen' },
    { name: '冰雪', slug: 'ice' },
    { name: '高贵', slug: 'noble' },
  ];
  
  for (const { name, slug } of tags) {
    let tag = await prisma.tag.findFirst({ where: { slug } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name, slug } });
    }
    await prisma.characterTag.create({ data: { characterId, tagId: tag.id } });
  }
  console.log('标签添加成功');
  console.log('✅ 完成!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
