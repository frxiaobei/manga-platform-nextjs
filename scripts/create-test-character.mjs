import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'herove@gmail.com' } });
  if (!user) {
    console.log('用户不存在');
    return;
  }
  console.log('用户 ID:', user.id);

  const character = await prisma.character.create({
    data: {
      name: '冰霜女王·艾莎',
      description: '来自北境的冰雪女王，拥有操控冰霜的强大能力。性格冷艳高贵，内心却渴望温暖。适合用于奇幻、宫廷、冒险类作品。',
      price: 99.00,
      status: 'APPROVED',
      userId: user.id,
      publishedAt: new Date(),
    }
  });
  console.log('角色创建成功:', character.id);

  await prisma.asset.createMany({
    data: [
      { characterId: character.id, category: 'HERO', url: 'https://picsum.photos/seed/elsa1/800/1200', filename: 'hero.jpg', mimeType: 'image/jpeg', size: 100000, sortOrder: 0 },
      { characterId: character.id, category: 'DETAIL', url: 'https://picsum.photos/seed/elsa2/800/1200', filename: 'detail1.jpg', mimeType: 'image/jpeg', size: 100000, sortOrder: 1 },
      { characterId: character.id, category: 'DETAIL', url: 'https://picsum.photos/seed/elsa3/800/1200', filename: 'detail2.jpg', mimeType: 'image/jpeg', size: 100000, sortOrder: 2 },
    ]
  });
  console.log('图片添加成功');

  const tags = ['奇幻', '女王', '冰雪', '高贵'];
  for (const tagName of tags) {
    let tag = await prisma.tag.findFirst({ where: { name: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
    }
    await prisma.characterTag.create({ data: { characterId: character.id, tagId: tag.id } });
  }
  console.log('标签添加成功');
  console.log('✅ 测试角色创建完成!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
