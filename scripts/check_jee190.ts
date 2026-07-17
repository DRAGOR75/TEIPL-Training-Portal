import { db } from '../lib/prisma';
async function main() {
  const employee = await db.employee.findUnique({ where: { id: 'JEE190' } });
  console.log(JSON.stringify(employee, null, 2));
}
main().catch(console.error).finally(() => process.exit(0));
