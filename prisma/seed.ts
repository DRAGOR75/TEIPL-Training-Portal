import { PrismaClient, TrainingCategory, Grade } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { db as prisma } from '../lib/prisma';

const PROGRAM_DATA = [
    // --- FOUNDATIONAL ---
    { name: "Units and Conversion  (L0)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Tools, Measuring Instruments  (L0)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "HEMM Mining Machinery - (L1)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "HEMM Mining Machinery - (L2)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "HEMM Fundamentals (Eng, Hyd, Elect etc.)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "HEMM Maintenance & Adverse Effects of Wrong practices", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Fuel Consumption", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Auto Lubrication System - ALS - Lincoln", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Gears - Types, Failures, Maintenace", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Hoses Fitment Guidelines (L1)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Lubricants & Contamination control (L1)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "HEMM Troubleshooting - Engine, Hydraulics, Auto Elect  (L2)", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "Undercarriage & GETs", category: "FOUNDATIONAL", section: "All HEMM Sections" },
    { name: "HEMM Air Conditioners OMT", category: "FOUNDATIONAL", section: "All HEMM Sections" },

    // --- FUNCTIONAL ---
    { name: "Auto Electrical - Fundamentals - L1", category: "FUNCTIONAL", section: "Auto Electricals" },
    { name: "Auto Electrical - Operation and Troubleshooting - L2", category: "FUNCTIONAL", section: "Auto Electricals" },
    { name: "Auto Electrical - Failure Model & Analysis  (L3)", category: "FUNCTIONAL", section: "Auto Electricals" },
    { name: "AC Electrical - Operation and Maintenance  (L1)", category: "FUNCTIONAL", section: "AC Electricals HT/LT" },
    { name: "AC Electrical - Operation and Troubleshooting  (L2)", category: "FUNCTIONAL", section: "AC Electricals HT/LT" },
    { name: "AC Electrical - Failure Model & Analysis  (L3)", category: "FUNCTIONAL", section: "AC Electricals HT/LT" },
    { name: "C&S Electrical - Operation and Maintenance  (L1)", category: "FUNCTIONAL", section: "Crusher & Screening" },
    { name: "C&S Electrical - Operation and Troubleshooting  (L2)", category: "FUNCTIONAL", section: "Crusher & Screening" },
    { name: "C&S Mechanical - Operation and Maintenance  (L1)", category: "FUNCTIONAL", section: "Crusher & Screening" },
    { name: "C&S Mechanical - Operation and Troubleshooting (L2)", category: "FUNCTIONAL", section: "Crusher & Screening" },
    { name: "PLC & Instrumentation", category: "FUNCTIONAL", section: "Crusher & Screening" },
    { name: "BEML D155, BD65-1 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "BEML D155, BD65-1 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "BEML D155, BD65-1 - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Cat D11R - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Cat D11R - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Komatsu D155A-5, D155A-6, D375A-5, D375A-6 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Komatsu D155A-5, D155A-6, D375A-5, D375A-6 - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Komatsu D275A-5, D475A-5 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Komatsu D275A-5, D475A-5 - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Komatsu D85 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Komatsu D85 - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Liebherr PR 734L - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Santui DH24B2, DH17B2 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Santui DH24B2, DH17B2 - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Wheel dozar Komatsu WD600 - L1", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Wheel dozar Komatsu WD600 - L2", category: "FUNCTIONAL", section: "Bulldozer" },
    { name: "Diesel Engine (L1)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Diesel Engines OMT  (L2)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Failure Analysis/FIR/RCA (L3)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Starting system  (L2)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Air System OMT", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Fuel Systems  (L2)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Rebuild - Cummins K30/50  (L3)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Rebuild - Cummins QSK45/60 (L3)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Rebuild - Critical Procedures", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Rebuild - MTU Engine (L3)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Engine Rebuild - Volvo D13  (L3)", category: "FUNCTIONAL", section: "Diesel Engines" },
    { name: "Diesel Generator O/M/T  (L2)", category: "FUNCTIONAL", section: "Diesel Generator" },
    { name: "BOART LONGYEAR DB525, SHANDONG XY-3, SHANDONG XYD-3  (L2)", category: "FUNCTIONAL", section: "Drill Machines" },
    { name: "BOART LONGYEAR LF90D, SANDVIK DE710  (L2)", category: "FUNCTIONAL", section: "Drill Machines" },
    { name: "Doosan VHP 475, Doosan HP 450, IR HP 450, ELGI PG 75E  (L2)", category: "FUNCTIONAL", section: "Drill Machines" },
    { name: "ELGI PG 110E - 13.5-ELEC  (L2)", category: "FUNCTIONAL", section: "Drill Machines" },
    { name: "Revathi Drill C650E-ELEC  (L2)", category: "FUNCTIONAL", section: "Drill Machines" },
    { name: "SANDVIK DI550, SANDVIK DP1100, ATLASCOPCO D35, SANDVIK DX800, EPIROC PRD HC 500M, IR LM100   (L2)", category: "FUNCTIONAL", section: "Drill Machines" },
    { name: "Belaz 75306,75302 - L1", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "Belaz 75306,75302 - L2", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "BEML BH50M, BH40 - L1", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "BEML BH50M, BH40 - L2", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "CAT 777D Dumper - L1", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "CAT 777D Dumper - L2", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "CAT 773E Dumper - L1", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "CAT 773E Dumper - L2", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "Dumper HD 785 - Brake system  (L2)", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "Komatsu HD785-7, HD785-5 - L1", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "Komatsu HD785-7, HD785-5 - L2", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "Sany SKT90S,SKT105S - L1", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "Sany SKT90S,SKT105S - L2", category: "FUNCTIONAL", section: "Dumpers" },
    { name: "EH4500, EH5000 - L1", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "EH4500, EH5000 - L2", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Komatsu 830E-AC - L1", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Komatsu 830E-AC - L2", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Komatsu 830E-DC - L1", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Komatsu 830E-DC - L2", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Komatsu 830E-DC/AC Mechanical - L1 ", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Komatsu 830E-DC/AC Mechanical - L2", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Sany SKT105E - L1", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Sany SKT105E - L2", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "Wheel Motors Rebuild (L3)", category: "FUNCTIONAL", section: "Elect Dumpers" },
    { name: "JCB NXT215LC", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Hitachi Excavator Hydraulics  (L2)", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Hitachi Pressure and Flow Testing & Adjustment (L3)", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Komatsu Excavator Hydraulics  (L2)", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Komatsu Pressure and Flow Testing & Adjustment (L3)", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Komatsu Excavators Comparison  (L1)", category: "FUNCTIONAL", section: "Excavators" },
    { name: "KOMATSU PC210, PC300, PC450 - L1", category: "FUNCTIONAL", section: "Excavators" },
    { name: "KOMATSU PC210, PC300, PC450 - L2", category: "FUNCTIONAL", section: "Excavators" },
    { name: "KOMATSU PC 3000 - L1", category: "FUNCTIONAL", section: "Excavators" },
    { name: "KOMATSU PC 3000 - L2", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Liebherr A920", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Liebherr R996, R984, R9350 - L1", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Liebherr R996, R984, R9350 - L2", category: "FUNCTIONAL", section: "Excavators" },
    { name: "SANY SY870-10HD (L1)", category: "FUNCTIONAL", section: "Excavators" },
    { name: "TATA HITACHI 70, 110,220,210, 370 - L1", category: "FUNCTIONAL", section: "Excavators" },
    { name: "TATA HITACHI 70, 110,220,210, 370 - L2", category: "FUNCTIONAL", section: "Excavators" },
    { name: "TATA HITACHI EX1200,2500", category: "FUNCTIONAL", section: "Excavators" },
    { name: "TATA HITACHI ZX650,470,450, 870H-3,3F,5G", category: "FUNCTIONAL", section: "Excavators" },
    { name: "TATA HITACHI ZX670 - L1", category: "FUNCTIONAL", section: "Excavators" },
    { name: "TATA HITACHI ZX670 - L2", category: "FUNCTIONAL", section: "Excavators" },
    { name: "VOLVO EC300, EC290, EC210", category: "FUNCTIONAL", section: "Excavators" },
    { name: "VOLVO EC750, EC700", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Electrical Excavators - Power Electricals & Controls (L3)", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "KOMATSU PC 300 ELEC", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "KOMATSU PC 3000 ELEC - L1", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "KOMATSU PC 3000 ELEC - L2", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TATA HITACHI EX110-ELEC", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TATA HITACHI EX1200-ELEC - L1", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TATA HITACHI EX1200-ELEC - L2", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TATA HITACHI EX 2500 ELEC - L1", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TATA HITACHI EX 2500 ELEC - L2", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TEREX RH340B, RH120E - L1", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "TEREX RH340B, RH120E - L2", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "Electrical Exacavator - Mechanical - L1", category: "FUNCTIONAL", section: "Excavators - Elect Drive" },
    { name: "Liebherr R996 Elect - L1", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Liebherr R996 Elect - L2", category: "FUNCTIONAL", section: "Excavators" },
    { name: "Final Drive - L1", category: "FUNCTIONAL", section: "Final Drive" },
    { name: "BEML BG825", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "CASE 865-C", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "Cat 24H", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "Graders - Operation and Maintenance  (L1)", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "Graders - Operation and Troubleshooting  (L2)", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "KOMATSU GD825A, GD535, GD 705, GD511", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "SANY SMG200", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "VOLVO G930", category: "FUNCTIONAL", section: "Graders Section" },
    { name: "Failure Analysis & FIR - Hydraulics (L3)", category: "FUNCTIONAL", section: "Hydraulics Repairs" },
    { name: "Hydraulic Troubleshooting", category: "FUNCTIONAL", section: "Hydraulics Repairs" },
    { name: "Hydraulics Component Rebuild", category: "FUNCTIONAL", section: "Hydraulics Repairs" },
    { name: "Hydraulics Fundamentals - L1", category: "FUNCTIONAL", section: "Hydraulics Repairs" },
    { name: "Rope shovels P&H2100BL - L1", category: "FUNCTIONAL", section: "Rope Shovels" },
    { name: "Rope shovels P&H2100BL - L2", category: "FUNCTIONAL", section: "Rope Shovels" },
    { name: "Transmission operation and Maintenance - L1", category: "FUNCTIONAL", section: "Transmission Rebuilt" },
    { name: "HEMM Powertrain - L2", category: "FUNCTIONAL", section: "Transmission Rebuilt" },
    { name: "Transmission Rebuild _Komatsu", category: "FUNCTIONAL", section: "Transmission Rebuilt" },
    { name: "Transmission Rebuild _Volvo", category: "FUNCTIONAL", section: "Transmission Rebuilt" },
    { name: "Volvo FM400, FMX440, FMX460, FMX480 - L1", category: "FUNCTIONAL", section: "Trucks" },
    { name: "Volvo FM400, FMX440, FMX460, FMX480 - L2", category: "FUNCTIONAL", section: "Trucks" },
    { name: "Scania P440, Eicher Pro 8035 Xm - L1", category: "FUNCTIONAL", section: "Trucks" },
    { name: "Scania P440, Eicher Pro 8035 Xm - L2", category: "FUNCTIONAL", section: "Trucks" },
    { name: "Tyre Failures and Maintenance", category: "FUNCTIONAL", section: "Tyre Section" },
    { name: "Welding", category: "FUNCTIONAL", section: "Welding Section" },
    { name: "HM", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "Loaders - Operation and Maintenance (L1)", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "Loaders - Operation and Troubleshooting  (L2)", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "SDLG L958H, L958F,L 956H,LG958L - L1", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "SDLG L958H, L958F,L 956H,LG958L - L2", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "Volvo L220G, L220H - L1", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "Volvo L220G, L220H - L2", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "XCMG ZL50G", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "KOMATSU WA800-3, WA470 - L1", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "KOMATSU WA800-3, WA470 - L2", category: "FUNCTIONAL", section: "Wheel Loaders" },
    { name: "Liugong CLG 856HE-ELECT - L1", category: "FUNCTIONAL", section: "Wheel Loaders Electrical" },
    { name: "Liugong CLG 856HE-ELECT - L2", category: "FUNCTIONAL", section: "Wheel Loaders Electrical" },
    { name: "Volvo JL120 Electrical (L2)", category: "FUNCTIONAL", section: "Wheel Loaders Electrical" },
    { name: "AFDSS - L1", category: "FUNCTIONAL", section: "AFDSS" },
    { name: "LMV - L1", category: "FUNCTIONAL", section: "Light Motor Vehicle" },
    { name: "LMV - L2", category: "FUNCTIONAL", section: "Light Motor Vehicle" },
    { name: "Maintenance Planning and Budgeting", category: "FUNCTIONAL", section: "Planning Team - Mtc" },
    { name: "Planning Engineer", category: "FUNCTIONAL", section: "Planning Team - Mtc" },
    { name: "RCA / FMEA - Reliability Centered Maintenance", category: "FUNCTIONAL", section: "Planning Team - Mtc" },
    { name: "Inventory & Store/Warehouse Management", category: "FUNCTIONAL", section: "Procurement & Warehouse" },
    { name: "Parts Quality & supplier warranty", category: "FUNCTIONAL", section: "Procurement & Warehouse" },
    { name: "Procurement Planning & Inventory management", category: "FUNCTIONAL", section: "Procurement & Warehouse" },
    { name: "Procurement Processes", category: "FUNCTIONAL", section: "Procurement & Warehouse" }
];

async function main() {
    console.log('🚀 Starting deep seed process...');

    // 1. Sections
    const uniqueSectionNames = Array.from(new Set(PROGRAM_DATA.map(p => p.section)));
    const sectionMap = new Map<string, string>();

    console.log(`📂 Ensuring ${uniqueSectionNames.length} sections...`);
    for (const name of uniqueSectionNames) {
        const sec = await prisma.section.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        sectionMap.set(name, sec.id);
    }

    // 2. Programs
    console.log(`📝 Ensuring ${PROGRAM_DATA.length} programs...`);
    for (const p of PROGRAM_DATA) {
        const sectionId = sectionMap.get(p.section);
        if (!sectionId) continue;

        await prisma.program.upsert({
            where: { name: p.name },
            update: {
                category: p.category as TrainingCategory,
                sections: {
                    set: [{ id: sectionId }]
                }
            },
            create: {
                name: p.name,
                category: p.category as TrainingCategory,
                targetGrades: [Grade.EXECUTIVE, Grade.WORKMAN],
                sections: {
                    connect: { id: sectionId }
                }
            }
        });
    }

    console.log(`✅ Success! Upserted ${PROGRAM_DATA.length} programs across ${uniqueSectionNames.length} sections.`);

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