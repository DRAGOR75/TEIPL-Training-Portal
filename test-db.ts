import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const session = await prisma.trainingSession.findUnique({
    where: { id: 'e1919625-2fb9-4354-a9f1-7b1de4f947da' }
  });
  console.log('SESSION EXISTS:', !!session);
}

main().catch(console.error).finally(() => prisma.$disconnect());
