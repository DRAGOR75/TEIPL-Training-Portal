import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    const ids = ['10022852', '10022853', '10022854', '10022855'];
    
    for (const id of ids) {
        const emp = await db.employee.findUnique({
            where: { id }
        });
        
        if (emp) {
            console.log(`✅ ${id} - Found: ${emp.name} (${emp.designation})`);
        } else {
            console.log(`❌ ${id} - NOT FOUND in database.`);
        }
    }
}

main().catch(console.error).finally(() => db.$disconnect());
