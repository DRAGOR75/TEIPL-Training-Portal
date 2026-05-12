import { db as prisma } from '../lib/prisma';

async function main() {
  const subjects = await prisma.manualSubject.findMany();
  console.log('Subjects:', subjects);
  
  const subjectModules = await prisma.subjectModule.findMany({
    include: { module: true }
  });
  console.log('SubjectModules:', subjectModules);
  
  const modules = await prisma.manualModule.findMany();
  console.log('Modules:', modules);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
