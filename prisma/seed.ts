import { PrismaClient, TrainingCategory, Grade } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SECTIONS = [
    'Mining',
    'Mechanical',
    'Electrical',
    'Geology',
    'Survey',
    'Civil',
    'Safety',
    'Environment',
    'HR & Admin',
    'Finance',
    'IT & Systems',
    'Logistics',
    'Commercial',
    'Labs (Chemistry)',
    'Legal'
];

const COMMON_PROGRAMS = [
    { name: 'Communication Skills', category: 'BEHAVIOURAL' },
    { name: 'Leadership Development', category: 'BEHAVIOURAL' },
    { name: 'Time Management', category: 'BEHAVIOURAL' },
    { name: 'Emotional Intelligence', category: 'BEHAVIOURAL' },
    { name: 'Safety First Culture', category: 'COMMON' },
    { name: 'Code of Conduct', category: 'COMMON' },
    { name: 'POSH Awareness', category: 'COMMON' },
];

const FUNCTIONAL_PROGRAMS: Record<string, string[]> = {
    'Mining': [
        'Advanced Blasting Techniques',
        'Mine Planning & Design',
        'Heavy Earth Moving Machinery (HEMM) Operations',
        'Mineral Conservation',
    ],
    'Mechanical': [
        'Hydraulic Systems Maintenance',
        'Preventive Maintenance of HEMM',
        'Welding Technology Updates',
        'Auto-Electrical Systems',
    ],
    'Electrical': [
        'HT/LT Switchgear Maintenance',
        'Transformer Protection',
        'PLC & SCADA Systems',
        'Electrical Safety Standards',
    ],
    'Safety': [
        'Risk Assessment & Management',
        'Fire Fighting Techniques',
        'First Aid & Emergency Response',
        'Accident Investigation',
    ],
    'IT & Systems': [
        'Cyber Security Awareness',
        'Advanced Excel & Data Analysis',
        'ERP Training',
        'Network Administration',
    ],
    // Default for others to ensure they have something
    'default': [
        'Departmental SOP Review',
        'Cost Optimization Techniques',
        'Resource Management',
    ]
};

async function main() {
    console.log('🌱 Starting Seed...');

    // 1. Admin User
    const email = 'admin@thriveni.com';
    const password = 'thriveni2025';
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            name: 'Super Admin',
            password: hashedPassword,
        },
    });
    console.log(`✅ Admin ensured: ${email}`);

    // 2. Create Sections
    const sectionMap = new Map<string, string>(); // Name -> ID

    for (const name of SECTIONS) {
        const sec = await prisma.section.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        sectionMap.set(name, sec.id);
        console.log(`Checking Section: ${name}`);
    }

    // 3. Create Common/Behavioral Programs (Available to All Sections usually, or just general)
    // For simplicity, we link them to ALL sections or leave them unconnected if logic allows.
    // The schema says: Programs <-> Sections. 
    // Strategy: Link "Common" programs to ALL sections so they appear for everyone? 
    // Or just rely on Category filtering in the UI? 
    // Let's link them to all sections to be safe for "Select Section -> See Courses" logic if that's how it works.
    // Actually, better: "Behavioral" might not need a section link if we fetch by Category.
    // But let's follow the schema: Program belongs to Sections.

    // Let's just create them first.
    for (const p of COMMON_PROGRAMS) {
        await prisma.program.upsert({
            where: { name: p.name },
            update: {
                category: p.category as TrainingCategory,
                // Default to both grades
                targetGrades: [Grade.EXECUTIVE, Grade.WORKMAN]
            },
            create: {
                name: p.name,
                category: p.category as TrainingCategory,
                targetGrades: [Grade.EXECUTIVE, Grade.WORKMAN],
            }
        });
    }
    console.log('✅ Common/Behavioral Programs seeded');

    // 4. Create Functional Programs and Link to Sections
    for (const [sectionName, programs] of Object.entries(FUNCTIONAL_PROGRAMS)) {
        // If 'default', apply to all sections that don't have specific list? 
        // For now, let's just stick to the specific ones defined.

        const targetSectionNames = sectionName === 'default'
            ? SECTIONS.filter(s => !FUNCTIONAL_PROGRAMS[s])
            : [sectionName];

        for (const targetSecName of targetSectionNames) {
            const sectionId = sectionMap.get(targetSecName);
            if (!sectionId) continue;

            for (const progName of programs) {
                // Create Program
                const program = await prisma.program.upsert({
                    where: { name: progName },
                    update: {
                        category: TrainingCategory.FUNCTIONAL,
                        sections: {
                            connect: { id: sectionId }
                        }
                    },
                    create: {
                        name: progName,
                        category: TrainingCategory.FUNCTIONAL,
                        targetGrades: [Grade.EXECUTIVE, Grade.WORKMAN],
                        sections: {
                            connect: { id: sectionId }
                        }
                    }
                });
            }
        }
    }
    console.log('✅ Functional Programs seeded and linked');

    console.log('🌿 Seeding Completed.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });