
import 'dotenv/config';
import { db } from './lib/prisma';

async function main() {
    console.log("--- DATABASE CONNECTION DIAGNOSTIC ---");

    try {
        // 1. Query Database Identity
        const idResult = await db.$queryRaw`SELECT current_database(), current_user, version(), session_user`;
        console.log("Database Identity:", idResult);

        // 2. Check Table Owners
        const owners = await db.$queryRaw`
            SELECT tablename, tableowner 
            FROM pg_tables 
            WHERE schemaname = 'public'
        `;
        console.log("Table Owners:", owners);

        // 3. Check Current User Roles
        const roles = await db.$queryRaw`
            SELECT r.rolname, 
                   r.rolsuper, 
                   r.rolinherit, 
                   r.rolcreaterole, 
                   r.rolcreatedb, 
                   r.rolcanlogin
            FROM pg_roles r
            LEFT JOIN pg_auth_members m ON r.oid = m.roleid
            LEFT JOIN pg_roles u ON u.oid = m.member
            WHERE u.rolname = (SELECT current_user) OR r.rolname = (SELECT current_user)
        `;
        console.log("User Roles (Self/Memberships):", roles);

    } catch (error) {
        console.error("Diagnostic Failed:", error);
    }
    console.log("--- DIAGNOSTIC COMPLETE ---");
}

main();
