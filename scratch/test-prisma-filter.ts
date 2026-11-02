import { Prisma } from '@prisma/client';

try {
  const where: Prisma.EmployeeWhereInput = {
    AND: [
      {
        OR: [
          { managerEmail: null },
          // @ts-ignore
          { managerEmail: { not: { equals: 'test@example.com', mode: 'insensitive' } } }
        ]
      }
    ]
  };
  console.log('Constructed where:', where);
} catch (e) {
  console.error('Error:', e);
}

