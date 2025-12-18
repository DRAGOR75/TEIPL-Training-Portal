import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@thriveni.com';
    const password = 'thriveni2025'; // Default password

    // 1. Hash the password (security requirement)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Upsert (Create or Update)
    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            name: 'Super Admin',
            password: hashedPassword,
        },
    });

    console.log(`✅ Admin Created: ${user.email}`);
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