import { db as prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🚀 Seeding admin user only...');

    const hashedPassword = await bcrypt.hash('thriveni2025', 10);
    const email = 'admin@thriveni.com';

    await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: { email, name: 'Admin', password: hashedPassword, role: 'ADMIN' },
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
