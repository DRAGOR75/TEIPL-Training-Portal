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
    const sysRecords = await db.systemTrainingHistory.findMany({
        where: { empId: { in: empIds } },
        select: {
            id: true,
            empId: true,
            employeeName: true,
            programName: true,
            sessionId: true,
            startDate: true,
            employeeGrouupMNmw: true,
            createdAt: true
        }
    });

    console.log(`Found ${sysRecords.length} system history records.`);
    sysRecords.slice(0, 10).forEach(r => {
        console.log(`Emp: ${r.empId} (${r.employeeName}) | Prog: ${r.programName} | SessionId: ${r.sessionId} | Created: ${r.createdAt}`);
    });

    // Check if these sessions were finalized via attendance or sync script
    const sessionIds = sysRecords.map(r => r.sessionId).filter(Boolean) as string[];
    const sessions = await db.trainingSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, programName: true, status: true, attendanceFinalizedAt: true }
    });
    console.log(`\nMatching training sessions:`);
    sessions.forEach(s => {
        console.log(`Session: ${s.id} | Prog: ${s.programName} | Status: ${s.status} | FinalizedAt: ${s.attendanceFinalizedAt}`);
    });
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
