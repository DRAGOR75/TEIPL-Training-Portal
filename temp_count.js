const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.employee.count();
  const nominationCount = await prisma.nomination.count();
  console.log('Unique Employees Count:', count);
  console.log('Total TNI Records:', nominationCount);
}
main().catch(console.error).finally(() => prisma.$disconnect());
