import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create level data
  const levels = [
    {
      levelId: 1,
      levelName: 'Garden Adventure',
      maxChocolates: 30,
      maxEggs: 20,
      totalElements: 50,
      difficulty: 'easy',
    },
    {
      levelId: 2,
      levelName: 'Forest Quest',
      maxChocolates: 35,
      maxEggs: 25,
      totalElements: 60,
      difficulty: 'medium',
    },
    {
      levelId: 3,
      levelName: 'Mountain Challenge',
      maxChocolates: 40,
      maxEggs: 30,
      totalElements: 70,
      difficulty: 'hard',
    },
    {
      levelId: 4,
      levelName: 'Sky Journey',
      maxChocolates: 30,
      maxEggs: 25,
      totalElements: 55,
      difficulty: 'medium',
    },
    {
      levelId: 5,
      levelName: 'Ocean Mystery',
      maxChocolates: 35,
      maxEggs: 30,
      totalElements: 65,
      difficulty: 'hard',
    },
  ];

  for (const level of levels) {
    const existingLevel = await prisma.levelData.findUnique({
      where: { levelId: level.levelId },
    });

    if (!existingLevel) {
      await prisma.levelData.create({
        data: level,
      });
      console.log(`✅ Created level: ${level.levelName}`);
    }
  }

  console.log('🌱 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
