import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding admin user only...');

    const hashedPassword = await bcrypt.hash('thriveni2025', 10);
    const email = 'admin@thriveni.com';

    await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: { email, name: 'Admin', password: hashedPassword },
    });

    console.log('👤 Admin ensured: admin@thriveni.com');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error during admin seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
