import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create level data - Godot specs
  const levels = [
    {
      levelId: 1,
      levelName: 'Farm House',
      maxChocolates: 30,
      maxDiamonds: 2,
      maxEggs: 2,
      totalElements: 34,
      difficulty: 'easy',
    },
    {
      levelId: 2,
      levelName: 'Forest Quest',
      maxChocolates: 30,
      maxDiamonds: 2,
      maxEggs: 2,
      totalElements: 34,
      difficulty: 'easy',
    },
    {
      levelId: 3,
      levelName: 'Mountain Challenge',
      maxChocolates: 24,
      maxDiamonds: 1,
      maxEggs: 3,
      totalElements: 28,
      difficulty: 'medium',
    },
    {
      levelId: 4,
      levelName: 'Sky Journey',
      maxChocolates: 36,
      maxDiamonds: 1,
      maxEggs: 1,
      totalElements: 38,
      difficulty: 'medium',
    },
    {
      levelId: 5,
      levelName: 'Ocean Mystery',
      maxChocolates: 20,
      maxDiamonds: 1,
      maxEggs: 2,
      totalElements: 23,
      difficulty: 'hard',
    },
    {
      levelId: 6,
      levelName: 'Cave Adventure',
      maxChocolates: 40,
      maxDiamonds: 1,
      maxEggs: 2,
      totalElements: 43,
      difficulty: 'hard',
    },
    {
      levelId: 7,
      levelName: 'Forest Deepness',
      maxChocolates: 20,
      maxDiamonds: 1,
      maxEggs: 2,
      totalElements: 23,
      difficulty: 'hard',
    },
    {
      levelId: 8,
      levelName: 'Final Challenge',
      maxChocolates: 40,
      maxDiamonds: 1,
      maxEggs: 2,
      totalElements: 43,
      difficulty: 'expert',
    },
    {
      levelId: 9,
      levelName: 'Ultimate Quest',
      maxChocolates: 30,
      maxDiamonds: 1,
      maxEggs: 20,
      totalElements: 51,
      difficulty: 'expert',
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
      console.log(`✅ Created level ${level.levelId}: ${level.levelName}`);
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
