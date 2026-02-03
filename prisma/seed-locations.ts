
import { db as prisma } from '../lib/prisma';

const locationData = [
    "TRC",
    "PB",
    "Odisha",
    "SIOM",
    "Mangampet"
];

async function main() {
    console.log('Start seeding locations...');

    for (const locName of locationData) {
        await prisma.location.upsert({
            where: { name: locName },
            update: {},
            create: {
                name: locName
            },
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
