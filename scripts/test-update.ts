import { updateEmployeeProfile } from '../app/actions/tni';
import { db } from '../lib/prisma';

async function testUpdate() {
    console.log("Updating JEE189...");
    const res = await updateEmployeeProfile('JEE189', {
        name: 'Pankaj Kumar',
        email: 'JEE189@thriveni.com',
        grade: 'EXECUTIVE',
        sectionName: 'IT',
        location: 'HQ',
        region: 'TestRegion',
        organization: 'TestOrg',
        department: 'TestDept'
    });
    console.log("Update result:", res);
    
    const emp = await db.employee.findUnique({ where: { id: 'JEE189' } });
    console.log("DB after update:", emp);
}

testUpdate().catch(console.error).finally(() => process.exit(0));
