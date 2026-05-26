import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const designations = await prisma.designation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("Recent Designations:");
  console.table(designations);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
