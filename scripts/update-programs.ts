import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    try {
        console.log("Fetching training sessions with specified session categories...");
        const sessions = await db.trainingSession.findMany({
            where: {
                sessionCategory: {
                    in: ['Technical', 'Technical by OEM', 'Technical at OEM']
                }
            },
            select: { programName: true }
        });

        const programNames = Array.from(new Set(sessions.map(s => s.programName)));
        console.log(`Found ${programNames.length} unique programs to update.`);

        if (programNames.length > 0) {
            const result = await db.program.updateMany({
                where: {
                    name: { in: programNames }
                },
                data: {
                    category: 'HEMM_PROGRAMS'
                }
            });
            console.log(`Successfully updated ${result.count} programs to HEMM_PROGRAMS.`);
        } else {
            console.log("No programs needed updating.");
        }
    } catch (error) {
        console.error("Error updating programs:", error);
    } finally {
        await db.$disconnect();
    }
}

main();
