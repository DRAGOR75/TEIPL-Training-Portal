import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    try {
        console.log("Updating TrainingHistory...");
        const res1 = await db.trainingHistory.updateMany({
            where: {
                sessionCategory: {
                    in: ['Technical', 'Technical by OEM', 'Technical at OEM']
                }
            },
            data: {
                progCategory: 'HEMM_PROGRAMS'
            }
        });
        console.log(`Updated ${res1.count} records in TrainingHistory.`);

        console.log("Updating SystemTrainingHistory...");
        const res2 = await db.systemTrainingHistory.updateMany({
            where: {
                sessionCategory: {
                    in: ['Technical', 'Technical by OEM', 'Technical at OEM']
                }
            },
            data: {
                progCategory: 'HEMM_PROGRAMS'
            }
        });
        console.log(`Updated ${res2.count} records in SystemTrainingHistory.`);

    } catch (error) {
        console.error("Error updating history tables:", error);
    } finally {
        await db.$disconnect();
    }
}

main();
