import 'dotenv/config';
import { db } from '../lib/prisma';

const targetEmpIds = [
    '40000424',
    '71001011',
    '40000646',
    '2000223',
    '71004707'
];

async function main() {
    for (const empId of targetEmpIds) {
        console.log(`\n================================================================`);
        console.log(`EMPLOYEE ID: ${empId}`);
        console.log(`================================================================`);

        // 1. Employee Master details
        const emp = await db.employee.findUnique({
            where: { id: empId },
            include: {
                nominations: {
                    include: {
                        program: true
                    }
                }
            }
        });

        if (emp) {
            console.log(`[MASTER] Name: ${emp.name}`);
            console.log(`  Grade: ${emp.grade} | Designation: ${emp.designation} | Dept: ${emp.department}`);
            console.log(`  Section: ${emp.sectionName} | Org: ${emp.organization} | On-Roll: ${emp.onRollContract}`);
            console.log(`  M/NM/W: ${emp.employeeGrouupMNmw} | Location: ${emp.location} | Region: ${emp.region}`);
            console.log(`  Nominations Count: ${emp.nominations.length}`);
            emp.nominations.forEach(n => {
                console.log(`    - Nominated Program: ${n.program.name} (Code: ${n.program.id}, Category: ${n.program.category}, Target Grade: ${n.program.targetGrade})`);
            });
        } else {
            console.log(`[MASTER] NOT FOUND in Employee table!`);
        }

        // 2. System Training History
        const sysRecords = await db.systemTrainingHistory.findMany({
            where: { empId: empId }
        });
        console.log(`\n[SYSTEM TRAINING HISTORY] Total: ${sysRecords.length}`);
        sysRecords.forEach(s => {
            console.log(`  - Program: "${s.programName}" | Days: ${s.trainingDays} | Hours: ${s.trainingHours}`);
            console.log(`    Dates: ${s.startDate.toISOString().split('T')[0]} to ${s.endDate.toISOString().split('T')[0]}`);
            console.log(`    M/NM/W: "${s.employeeGrouupMNmw}" | Group: "${s.employeeGroup}" | Desig: "${s.designation}" | Dept: "${s.department}"`);
        });

        // 3. Legacy Training History
        const legRecords = await db.trainingHistory.findMany({
            where: { empId: empId }
        });
        console.log(`\n[LEGACY TRAINING HISTORY] Total: ${legRecords.length}`);
        legRecords.forEach(l => {
            console.log(`  - Program: "${l.programName}" | Days: ${l.trainingDays} | Hours: ${l.trainingHours}`);
            console.log(`    Dates: ${l.startDate.toISOString().split('T')[0]} to ${l.endDate.toISOString().split('T')[0]}`);
            console.log(`    M/NM/W: "${l.employeeGrouupMNmw}" | Group: "${l.employeeGroup}" | Desig: "${l.designation}" | Dept: "${l.department}"`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
