import 'dotenv/config';
import { db as prisma } from '../lib/prisma';

async function main() {
    console.log("Starting script to update employeeLocation...");

    // 1. Get all distinct empIds currently in SystemTrainingHistory
    const distinctRecords = await prisma.systemTrainingHistory.findMany({
        select: { empId: true },
        distinct: ['empId']
    });

    const empIdsInHistory = distinctRecords.map(r => r.empId);
    console.log(`Found ${empIdsInHistory.length} unique employees in SystemTrainingHistory.`);

    if (empIdsInHistory.length === 0) {
        console.log("No records to update.");
        return;
    }

    // 2. Fetch locations for ONLY those specific employees
    const employees = await prisma.employee.findMany({
        where: {
            id: { in: empIdsInHistory },
            location: { not: null }
        },
        select: {
            id: true,
            location: true
        }
    });

    console.log(`Found ${employees.length} of those employees with an assigned location.`);

    let updatedSystemHistoryCount = 0;

    // 3. Update only for this small subset
    for (const emp of employees) {
        const sysResult = await prisma.systemTrainingHistory.updateMany({
            where: {
                empId: emp.id
            },
            data: {
                employeeLocation: emp.location
            }
        });
        updatedSystemHistoryCount += sysResult.count;
    }

    console.log(`Update complete!`);
    console.log(`- Updated ${updatedSystemHistoryCount} records in SystemTrainingHistory`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
