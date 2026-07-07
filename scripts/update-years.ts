import 'dotenv/config';
import { db as prisma } from '../lib/prisma';

function getFinancialYear(date: Date): string {
    const fullYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-11
    
    let startYear, endYear;
    if (currentMonth < 3) { // Jan, Feb, Mar belong to previous financial year
        startYear = fullYear - 1;
        endYear = fullYear;
    } else { // Apr-Dec belong to current financial year
        startYear = fullYear;
        endYear = fullYear + 1;
    }
    
    return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

async function main() {
    console.log("Starting year update migration...");

    // Update SystemTrainingHistory
    const systemHistories = await prisma.systemTrainingHistory.findMany();
    let sysUpdated = 0;
    
    for (const record of systemHistories) {
        if (!record.startDate) continue;
        
        const correctYear = getFinancialYear(new Date(record.startDate));
        
        if (record.year !== correctYear) {
            await prisma.systemTrainingHistory.update({
                where: { id: record.id },
                data: { year: correctYear }
            });
            sysUpdated++;
        }
    }
    console.log(`Updated ${sysUpdated} records in SystemTrainingHistory`);

    // Update TrainingHistory (Legacy and System copies)
    const legacyHistories = await prisma.trainingHistory.findMany();
    let legacyUpdated = 0;
    
    for (const record of legacyHistories) {
        if (!record.startDate) continue;
        
        const correctYear = getFinancialYear(new Date(record.startDate));
        
        if (record.year !== correctYear) {
            await prisma.trainingHistory.update({
                where: { id: record.id },
                data: { year: correctYear }
            });
            legacyUpdated++;
        }
    }
    console.log(`Updated ${legacyUpdated} records in TrainingHistory`);

    console.log("Migration complete!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
