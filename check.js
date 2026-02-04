
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const locs = await prisma.location.findMany();
    console.log('COUNT:', locs.length);
    locs.forEach(l => console.log('LOC:', l.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
