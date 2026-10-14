import 'dotenv/config';
import { db } from '../lib/prisma';

const empIds = [
    '71007159', '90003918', '90003920', '90003817', '90003449', '90003700',
    '90003919', '10022635', '2517027', '71007490', '71007915', '71004707',
    '2000223', '10022665', '71003306', '71001011', '10022667', '90003702',
    '90003704', '90003699', '40000646', '90003447', '71008081', '40000424',
    '10022666', '10022569'
];

async function main() {
    console.log(`Checking ${empIds.length} employees...`);

    // 1. Check in employees table
    const employees = await db.employee.findMany({
        where: { id: { in: empIds } },
        select: {
            id: true,
            name: true,
            employeeGrouupMNmw: true,
            grade: true,
            designation: true,
            department: true,
            organization: true,
            onRollContract: true
        }
    });
    console.log(`\nFound ${employees.length} employees in Employee Master.`);
    const empMap = new Map(employees.map(e => [e.id, e]));

    // 2. Check in system_training_history
    const sysHistory = await db.systemTrainingHistory.findMany({
        where: { empId: { in: empIds } },
        select: {
            id: true,
            empId: true,
            employeeName: true,
            programName: true,
            startDate: true,
            trainingDays: true,
            trainingHours: true,
            employeeGrouupMNmw: true,
            employeeGroup: true,
            designation: true,
            organization: true,
            onRollContract: true
        }
    });
    console.log(`\nFound ${sysHistory.length} records in SystemTrainingHistory.`);

    // 3. Check in training_history
    const legacyHistory = await db.trainingHistory.findMany({
        where: { empId: { in: empIds } },
        select: {
            id: true,
            empId: true,
            employeeName: true,
            programName: true,
            startDate: true,
            trainingDays: true,
            trainingHours: true,
            employeeGrouupMNmw: true,
            employeeGroup: true,
            designation: true,
            organization: true,
            onRollContract: true
        }
    });
    console.log(`\nFound ${legacyHistory.length} records in TrainingHistory (Legacy).`);

    // 4. Print breakdown for each employee
    console.log("\n=================== EMPLOYEE BREAKDOWN ===================");
    for (const id of empIds) {
        const emp = empMap.get(id);
        const sys = sysHistory.filter(s => s.empId === id);
        const leg = legacyHistory.filter(l => l.empId === id);

        console.log(`\nEmp ID: ${id} | Master Name: ${emp?.name || 'NOT FOUND IN MASTER'}`);
        console.log(`  Master -> M/NM/W: "${emp?.employeeGrouupMNmw}", Grade: "${emp?.grade}", Desig: "${emp?.designation}", Org: "${emp?.organization}", OnRoll: "${emp?.onRollContract}"`);
        console.log(`  SystemTrainingHistory count: ${sys.length}`);
        sys.forEach(s => {
            console.log(`    [SYS] Prog: "${s.programName}", Days: ${s.trainingDays}, Hours: ${s.trainingHours}, M/NM/W: "${s.employeeGrouupMNmw}", Group: "${s.employeeGroup}"`);
        });
        console.log(`  TrainingHistory (Legacy) count: ${leg.length}`);
        leg.forEach(l => {
            console.log(`    [LEG] Prog: "${l.programName}", Days: ${l.trainingDays}, Hours: ${l.trainingHours}, M/NM/W: "${l.employeeGrouupMNmw}", Group: "${l.employeeGroup}"`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
