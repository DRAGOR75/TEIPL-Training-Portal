import { PrismaClient, TrainingCategory, Grade } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { db as prisma } from '../lib/prisma';

const PROGRAM_DATA = [
    // --- FOUNDATIONAL ---
    { name: 'Units and Conversion (L0)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'Tools, Measuring Instruments (L0) (Set 1)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'Tools, Measuring Instruments (L0) (Set 2)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'Gears (Types, Failures, Maintenance)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'Hoses Fitment Guidelines (L1)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'Lubricants & Contamination control (L1)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'HEMM Troubleshooting (Engine, Hydraulics, Auto Elect) (L2)', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'Undercarriage & GETs', category: 'FOUNDATIONAL', section: 'HEMM Sections' },
    { name: 'HEMM Air Conditioners OMT', category: 'FOUNDATIONAL', section: 'HEMM Sections' },

    // --- FUNCTIONAL: CRUSHER & SCREENING ---
    { name: 'C&S Electrical (Operation and Maintenance) (L1)', category: 'FUNCTIONAL', section: 'Crusher & Screening' },
    { name: 'C&S Electrical (Operation and Troubleshooting) (L2)', category: 'FUNCTIONAL', section: 'Crusher & Screening' },
    { name: 'C&S Mechanical (Operation and Maintenance) (L1)', category: 'FUNCTIONAL', section: 'Crusher & Screening' },
    { name: 'C&S Mechanical (Operation and Troubleshooting) (L2)', category: 'FUNCTIONAL', section: 'Crusher & Screening' },

    // --- FUNCTIONAL: BULLDOZER ---
    { name: 'BEML D155, BD65-1 (L1)', category: 'FUNCTIONAL', section: 'Bulldozer' },
    { name: 'BEML D155, BD65-1 (L2)', category: 'FUNCTIONAL', section: 'Bulldozer' },
    { name: 'Cat D11R (L1)', category: 'FUNCTIONAL', section: 'Bulldozer' },
    { name: 'Cat D11R (L2)', category: 'FUNCTIONAL', section: 'Bulldozer' },

    // --- FUNCTIONAL: DIESEL ENGINES ---
    { name: 'Diesel Engine (L1)', category: 'FUNCTIONAL', section: 'Diesel Engines' },
    { name: 'Diesel Engines OMT (L2)', category: 'FUNCTIONAL', section: 'Diesel Engines' },
    { name: 'Engine Failure Analysis/FIR/RCA (L3)', category: 'FUNCTIONAL', section: 'Diesel Engines' },
    { name: 'Engine Starting system (L2)', category: 'FUNCTIONAL', section: 'Diesel Engines' },

    // --- FUNCTIONAL: DRILL MACHINES ---
    { name: 'BOART LONGYEAR DB525, SHANDONG XY-3, SHANDONG XYD-3 (L2)', category: 'FUNCTIONAL', section: 'Drill Machines' },
    { name: 'BOART LONGYEAR LF90D, SANDVIK DE710 (L2)', category: 'FUNCTIONAL', section: 'Drill Machines' },
    { name: 'Doosan VHP 475, Doosan HP 450, IR HP 450, ELGI PG 75E (L2)', category: 'FUNCTIONAL', section: 'Drill Machines' },
    { name: 'ELGI PG 110E (13.5-ELEC) (L2)', category: 'FUNCTIONAL', section: 'Drill Machines' },

    // --- FUNCTIONAL: DUMPERS ---
    { name: 'Belaz 75306, 75302 (L1)', category: 'FUNCTIONAL', section: 'Dumpers' },
    { name: 'Belaz 75306, 75302 (L2)', category: 'FUNCTIONAL', section: 'Dumpers' },
    { name: 'BEML BH50M, BH40 (L1)', category: 'FUNCTIONAL', section: 'Dumpers' },
    { name: 'BEML BH50M, BH40 (L2)', category: 'FUNCTIONAL', section: 'Dumpers' },
    { name: 'CAT 777D Dumper (L1)', category: 'FUNCTIONAL', section: 'Dumpers' },
    { name: 'CAT 777D Dumper (L2)', category: 'FUNCTIONAL', section: 'Dumpers' },

    // --- FUNCTIONAL: ELECTRIC DUMPERS ---
    { name: 'EH4500, EH5000 (L1)', category: 'FUNCTIONAL', section: 'Elect Dumpers' },
    { name: 'EH4500, EH5000 (L2)', category: 'FUNCTIONAL', section: 'Elect Dumpers' },
    { name: 'Komatsu 830E-AC (L1)', category: 'FUNCTIONAL', section: 'Elect Dumpers' },

    // --- FUNCTIONAL: EXCAVATORS ---
    { name: 'Hitachi Excavator Hydraulics (L2)', category: 'FUNCTIONAL', section: 'Excavators' },
    { name: 'Hitachi Pressure and Flow Testing & Adjustment (L3)', category: 'FUNCTIONAL', section: 'Excavators' },
    { name: 'Komatsu Excavator Hydraulics (L2)', category: 'FUNCTIONAL', section: 'Excavators' },
    { name: 'Electrical Excavators (Power Electricals & Controls) (L3)', category: 'FUNCTIONAL', section: 'Excavators - Elect Drive' },
    { name: 'KOMATSU PC 300 ELEC', category: 'FUNCTIONAL', section: 'Excavators - Elect Drive' },
    { name: 'KOMATSU PC 3000 ELEC (L1)', category: 'FUNCTIONAL', section: 'Excavators - Elect Drive' },
    { name: 'KOMATSU PC 3000 ELEC (L2)', category: 'FUNCTIONAL', section: 'Excavators - Elect Drive' },
    { name: 'TATA HITACHI EX110-ELEC', category: 'FUNCTIONAL', section: 'Excavators - Elect Drive' },

    // --- FUNCTIONAL: GRADERS ---
    { name: 'BEML BG825', category: 'FUNCTIONAL', section: 'Graders Section' },
    { name: 'CASE 865-C', category: 'FUNCTIONAL', section: 'Graders Section' },
    { name: 'Cat 24H', category: 'FUNCTIONAL', section: 'Graders Section' },

    // --- FUNCTIONAL: HYDRAULICS ---
    { name: 'Failure Analysis & FIR (Hydraulics) (L3)', category: 'FUNCTIONAL', section: 'Hydraulics Repairs' },
    { name: 'Hydraulic Troubleshooting', category: 'FUNCTIONAL', section: 'Hydraulics Repairs' },
    { name: 'Hydraulics Component Rebuild', category: 'FUNCTIONAL', section: 'Hydraulics Repairs' },

    // --- FUNCTIONAL: TRANSMISSION ---
    { name: 'Transmission operation and Maintenance (L1)', category: 'FUNCTIONAL', section: 'Transmission Rebuilt' },
    { name: 'Transmission operation and Maintenance (L2)', category: 'FUNCTIONAL', section: 'Transmission Rebuilt' },
    { name: 'Transmission Rebuild (Komatsu)', category: 'FUNCTIONAL', section: 'Transmission Rebuilt' },

    // --- FUNCTIONAL: TRUCKS & LOADERS ---
    { name: 'Volvo FM400, FMX440, FMX460, FMX480 (L1)', category: 'FUNCTIONAL', section: 'Trucks' },
    { name: 'Volvo FM400, FMX440, FMX460, FMX480 (L2)', category: 'FUNCTIONAL', section: 'Trucks' },
    { name: 'Scania P440, Eicher Pro 8035 Xm (L1)', category: 'FUNCTIONAL', section: 'Trucks' },
    { name: 'HM Loader', category: 'FUNCTIONAL', section: 'Wheel Loaders' },
    { name: 'Loaders (Operation and Maintenance) (L1)', category: 'FUNCTIONAL', section: 'Wheel Loaders' },
    { name: 'Loaders (Operation and Troubleshooting) (L2)', category: 'FUNCTIONAL', section: 'Wheel Loaders' },
    { name: 'SDLG L958H, L958F, L956H, LG958L (L1)', category: 'FUNCTIONAL', section: 'Wheel Loaders' },

    // --- OPERATORS ---
    { name: 'Operator (Dumpers)', category: 'FUNCTIONAL', section: 'Operators' },
    { name: 'Operator (Excavators)', category: 'FUNCTIONAL', section: 'Operators' },
    { name: 'Operator (Grader)', category: 'FUNCTIONAL', section: 'Operators' },
    { name: 'Operator (Loaders)', category: 'FUNCTIONAL', section: 'Operators' },
    { name: 'Operator (Volvo Truck)', category: 'FUNCTIONAL', section: 'Operators' },

    // --- BEHAVIORAL ---
    { name: 'Managerial Effectiveness Training', category: 'BEHAVIOURAL', section: 'All HODs / Managers' },
    { name: 'The art of communication & presentation skills', category: 'BEHAVIOURAL', section: 'All HODs / Managers' },
    { name: 'Campus to Corporate', category: 'BEHAVIOURAL', section: 'All Trainees / Freshers' },
    { name: 'Personality Development for Workmen', category: 'BEHAVIOURAL', section: 'All Workman' },

    // --- COMMON ---
    { name: 'Legislative knowledge of mining operations', category: 'COMMON', section: 'Mining Production' },
    { name: 'Mining Foreman', category: 'COMMON', section: 'Mining Production' },
    { name: 'Mining Mate', category: 'COMMON', section: 'Mining Production' },
    { name: 'Firewall', category: 'COMMON', section: 'Computers & IT' },
    { name: 'Train the Trainers', category: 'COMMON', section: 'Trainers' },
    { name: 'Contract management', category: 'COMMON', section: 'HR / IR' },
    { name: 'Laws and Regulations', category: 'COMMON', section: 'HR / IR' },
    { name: 'Finance for non finance', category: 'COMMON', section: 'All Managers / HODs' },
    { name: 'Six Sigma', category: 'COMMON', section: 'All Managers / HODs' }
];

async function main() {
    console.log('🚀 Starting deep seed process...');

    // 1. Cleanup old records to prevent dash/parentheses duplicates
    console.log('🧹 Clearing old Programs and Sections...');
    await prisma.program.deleteMany({});
    await prisma.section.deleteMany({});

    // 2. Admins
    const hashedPassword = await bcrypt.hash('thriveni2025', 10);
    const adminEmails = ['admin@thriveni.com', 'admin2@thriveni.com'];

    for (const email of adminEmails) {
        await prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword },
            create: { email, name: 'Admin', password: hashedPassword },
        });
    }
    console.log('👤 Admins ensured.');

    // 3. Sections
    const uniqueSectionNames = Array.from(new Set(PROGRAM_DATA.map(p => p.section)));
    const sectionMap = new Map<string, string>();

    for (const name of uniqueSectionNames) {
        const sec = await prisma.section.create({
            data: { name }
        });
        sectionMap.set(name, sec.id);
        console.log(`📂 Created Section: ${name}`);
    }

    // 4. Programs
    console.log('📝 Injecting 88 programs...');
    for (const p of PROGRAM_DATA) {
        const sectionId = sectionMap.get(p.section);
        if (!sectionId) continue;

        await prisma.program.create({
            data: {
                name: p.name,
                category: p.category as TrainingCategory,
                targetGrades: [Grade.EXECUTIVE, Grade.WORKMAN],
                sections: {
                    connect: { id: sectionId }
                }
            }
        });
    }

    console.log(`✅ Success! Seeded ${PROGRAM_DATA.length} programs across ${uniqueSectionNames.length} sections.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error during seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    });