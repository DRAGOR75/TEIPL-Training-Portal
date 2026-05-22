import { PrismaClient } from '@prisma/client';
import { db as prisma } from '../lib/prisma';

async function safeDelete(modelName: string, deleteFunc: () => Promise<any>) {
    try {
        console.log(`Cleaning ${modelName}...`);
        await deleteFunc();
    } catch (e: any) {
        if (e.code === 'P2021') {
            console.log(`⚠️ Table for ${modelName} does not exist yet. Skipping.`);
        } else {
            console.error(`❌ Error cleaning ${modelName}:`, e.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting Clean Slate for TNI System...');

    // Delete in order to respect foreign key constraints
    
    // 1. Delete History and Logs
    await safeDelete('TrainingHistory', () => prisma.trainingHistory.deleteMany());
    await safeDelete('EmailLog', () => prisma.emailLog.deleteMany());

    // 2. Delete Cohort data
    await safeDelete('CohortFeedback', () => prisma.cohortFeedback.deleteMany());
    await safeDelete('CohortMember', () => prisma.cohortMember.deleteMany());
    await safeDelete('CohortProgram', () => prisma.cohortProgram.deleteMany());
    await safeDelete('Cohort', () => prisma.cohort.deleteMany());

    // 3. Delete Session & Enrollment data
    await safeDelete('Enrollment', () => prisma.enrollment.deleteMany());
    await safeDelete('TrainingSession', () => prisma.trainingSession.deleteMany());

    // 4. Delete Nominations & Batches
    await safeDelete('Nomination', () => prisma.nomination.deleteMany());
    await safeDelete('NominationBatch', () => prisma.nominationBatch.deleteMany());

    // 5. Delete Base Tables (Programs, Sections, Employees)
    console.log('--- Cleaning Base Master Data ---');
    await safeDelete('Program', () => prisma.program.deleteMany());
    await safeDelete('Section', () => prisma.section.deleteMany());
    await safeDelete('Employee', () => prisma.employee.deleteMany());
    
    await safeDelete('Location', () => prisma.location.deleteMany());
    await safeDelete('Designation', () => prisma.designation.deleteMany());

    console.log('✅ Success! TNI Side of the database has been wiped clean.');
    console.log('🛡️  Troubleshooting, Manuals, and Admin Users were NOT touched.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error during cleanup:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
