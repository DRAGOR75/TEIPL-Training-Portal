import 'dotenv/config';
import { db } from '../lib/prisma';
import { parseFlexibleDate } from '../lib/date-utils';

interface RawCohortRow {
    id: string;
    status: string;
    name: string;
    cohortGroup: string;
    startDateStr: string;
    endDateStr: string;
    participants: number;
    durationDays: number;
    year: string;
}

const RAW_TSV_DATA = `1	Completed	Inplant Engrs Batch-1	Long Term-Engrs	08-Feb-21	04-Mar-21	10	22	20-21
2	Completed	Inplant Engrs Batch-2	Long Term-Engrs	16-Mar-21	09-Apr-21	12	22	21-22
3	Completed	Inplant Engrs Batch-3	Long Term-Engrs	27-Apr-21	15-May-21	6	17	21-22
4	Completed	Inplant Engrs Batch-4	Long Term-Engrs	08-Jul-21	17-Aug-21	8	35	21-22
5	Completed	Inplant Engrs Batch-5	Long Term-Engrs	18-Aug-21	18-Sep-21	17	28	21-22
6	Completed	Inplant Engrs Batch-6	Long Term-Engrs	20-Sep-21	03-Nov-21	19	39	21-22
7	Completed	Inplant Engrs Batch-7	Long Term-Engrs	08-Nov-21	10-Dec-21	22	29	21-22
8	Completed	Inplant Engrs Batch-8	Long Term-Engrs	14-Dec-21	10-Jan-22	20	25	21-22
9	Completed	Inplant Engrs Batch-9	Long Term-Engrs	16-Feb-22	31-Mar-22	16	38	21-22
10	Completed	Inplant Engrs Batch-10	Long Term-Engrs	09-Apr-22	14-May-22	12	31	22-23
11	Completed	Inplant Engrs Batch-11	Long Term-Engrs	08-Jun-22	12-Jul-22	4	30	22-23
12	Completed	Inplant Engrs Batch-12	Long Term-Engrs	30-Jun-22	18-Aug-22	2	43	22-23
13	Completed	Inplant Engrs Batch-13	Long Term-Engrs	06-Sep-22	15-Oct-22	21	35	22-23
14	Completed	Inplant Engrs Batch-14	Long Term-Engrs	29-Oct-22	02-Dec-22	10	30	22-23
16	Completed	Inplant Technicians Batch-1(Surjagad)	Long Term-Tech	23-Dec-22	18-Feb-23	18	50	22-23
17	Completed	Inplant Interns Batch-2	Long Term-Interns	27-Jun-23	09-Aug-23	27	38	23-24
18	Completed	Inplant Engrs Batch-16	Long Term-Engrs	14-Aug-23	19-Sep-23	13	31	23-24
19	Completed	Inplant Engrs Batch-17	Long Term-Engrs	03-Oct-23	02-Nov-23	10	27	23-24
20	Completed	Inplant Engrs Batch-18	Long Term-Engrs	04-Dec-23	05-Jan-24	15	29	23-24
21	Completed	Inplant Engrs Batch-19	Long Term-Engrs	08-Jan-24	10-Feb-24	8	29	23-24
22	Completed	Inplant Engrs Batch-20	Long Term-Engrs	20-Feb-24	05-Apr-24	13	40	24-25
23	Completed	Inplant Technicians Batch-2 (Surjagad)	Long Term-Tech	20-Feb-23	15-Apr-23	14	48	23-24
24	Completed	Inplant Engrs Batch-21	Long Term-Engrs	10-Apr-24	18-May-24	12	34	24-25
25	Completed	Inplant Interns Batch-1	Long Term-Interns	30-Apr-24	30-Jun-24	14	60	24-25
26	Completed	Inplant Technicians Batch-3	Long Term-Tech	26-May-24	27-Jul-24	25	55	24-25
27	Completed	Inplant Engrs Batch-22	Long Term-Engrs	20-Jun-24	30-Jul-24	10	34	24-25
28	Completed	Inplant Engrs Batch-23	Long Term-Engrs	05-Aug-24	10-Sep-24	13	35	24-25
29	Completed	Inplant Technicians Batch-4	Long Term-Tech	10-Aug-24	07-Oct-24	15	51	24-25
30	Completed	Inplant Engrs Batch-24	Long Term-Engrs	11-Sep-24	27-Sep-24	17	17	24-25
31	Completed	Inplant Engrs Batch-25	Long Term-Engrs	07-Oct-24	12-Nov-24	9	35	24-25
32	Completed	Inplant Technicians Batch-5	Long Term-Tech	21-Oct-24	14-Dec-24	17	55	24-25
33	Completed	Inplant Engrs Batch-26	Long Term-Engrs	25-Nov-24	24-Dec-24	10	30	24-25
34	Completed	Inplant Technicians Batch-6 (Surjagad)	Long Term-Tech	23-Dec-24	24-Feb-25	19	55	24-25
35	Completed	Inplant Technicians Batch-7	Long Term-Tech	03-Feb-25	08-Mar-25	9	29	24-25
36	Completed	Inplant Engrs Batch-27	Long Term-Engrs	03-Feb-25	08-Mar-25	12	29	24-25
37	Completed	Internship Training for VIT Students	Long Term-Interns	01-Sep-23	28-Sep-23	6	24	23-24
38	Completed	Inplant Engrs Batch-IIT	Long Term-Engrs	11-Jul-24	12-Oct-24	4	77	24-25
39	Completed	Inplant Engrs Batch -28	Long Term-Engrs	14-Apr-25	18-May-25	10	30	25-26
40	Completed	Inplant Technicians Batch -8	Long Term-Tech	21-Apr-25	21-Jun-25	13	55	25-26
41	Completed	Inplant Technicians Batch -9	Long Term-Tech	21-Apr-25	21-May-25	5	27	25-26
42	Completed	Inplant Engrs Batch -29	Long Term-Engrs	25-Jun-25	31-Jul-25	12	35	25-26
43	Completed	Inplant Technicians Batch -10	Long Term-Tech	22-Jul-25	22-Sep-25	7	55	25-26
44	Completed	Inplant Engrs Batch -30	Long Term-Engrs	11-Aug-25	15-Sep-25	10	35	25-26
45	Completed	Internship Students- SBU College	Long Term-Interns	19-May-25	28-Jun-25	12	36	25-26
46	Completed	Internship Students- SBU College	Long Term-Interns	09-Jun-25	05-Jul-25	1	24	25-26
47	Completed	Internship Students- RVS College	Long Term-Interns	21-Jun-25	16-Jul-25	2	23	25-26
48	Completed	Inplant Engrs Batch -31	Long Term-Engrs	22-Sep-25	25-Oct-25	9	30	25-26
49	Completed	Inplant Technicians Batch -11	Long Term-Tech	08-Oct-25	13-Dec-25	4	55	25-26
50	Completed	Inplant Engrs Batch-32	Long Term-Engrs	10-Nov-25	15-Dec-25	15	35	25-26
51	Completed	Inplant Technicians Batch -12	Long Term-Tech	21-Nov-25	21-Jan-25	12	55	25-26
52	Completed	Inplant Engrs Batch-33	Long Term-Engrs	22-Dec-25	21-Jan-26	15	27	25-26
53	Completed	Inplant Technicians Batch -13	Long Term- Tech	06-Feb-26	04-Apr-26	12	55	25-26
54	Completed	Inplant Engrs Batch-34	Long Term-Engrs	16-Feb-26	21-Mar-26	11	27	25-26
55	Completed	Inplant Engrs Batch-35	Long Term-Engrs	06-Apr-26	09-May-26	19	27	26-27
56	Completed	Inplant Technicians Batch -14	Long Term- Tech	27-Apr-26	27-Jun-26	4	55	26-27
57	Completed	Inplant Engrs Batch-36	Long Term-Engrs	18-May-26	20-Jun-26	10	27	26-27
58	Completed	Summer Internship Christ University Student	Long Term-Interns	03-Apr-26	28-May-26	1	38	26-27
59	Completed	 Internship Manipal University Student	Long Term-Interns	16-Jun-26	30-Jun-26	1	13	26-27
60	Completed	Internship St.Joshep College of Commerce Student	Long Term-Interns	19-Jun-26	27-Jun-26	1	8	26-27
61	Completed	Internship Ramchandra College of Engineering Student	Long Term-Interns	24-Jun-26	07-Aug-26	1	39	26-27
62	Completed	Inplant Engrs Batch-37	Long Term-Engrs	29-Jun-26	01-Aug-26	9	27	26-27
63	Completed	Inplant Technicians Batch -15	Long Term- Tech	17-Jul-26	17-Sep-26	17	55	26-27`;

function parseRow(line: string): RawCohortRow | null {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 9) return null;

    const [id, status, name, rawGroup, startStr, endStr, participantsStr, trgDaysStr, year] = parts;

    // Skip summary footer row if present
    if (!id || isNaN(Number(id))) return null;

    // Normalize group name: "Long Term- Tech" -> "Long Term-Tech"
    const cohortGroup = rawGroup.replace(/Long Term-\s+/i, 'Long Term-');

    return {
        id,
        status: status || 'Completed',
        name,
        cohortGroup,
        startDateStr: startStr,
        endDateStr: endStr,
        participants: parseInt(participantsStr, 10) || 0,
        durationDays: parseInt(trgDaysStr, 10) || 0,
        year: year || ''
    };
}

function parseDateWithCorrection(dateStr: string, startDate?: Date, batchId?: string): Date | undefined {
    let standardDate = parseFlexibleDate(dateStr);
    if (!standardDate) return undefined;

    let d = new Date(standardDate);

    // Batch 51 has typo: start 21-Nov-25, end 21-Jan-25 in FY 25-26. End date is obviously 21-Jan-2026.
    if (batchId === '51' && d.getFullYear() === 2025 && d.getMonth() === 0) {
        d = new Date('2026-01-21');
    } else if (startDate && d < startDate) {
        // If end date is chronologically before start date due to two-digit year rollover
        d.setFullYear(d.getFullYear() + 1);
    }

    return isNaN(d.getTime()) ? undefined : d;
}

export async function seedLongtermCohorts() {
    console.log('🚀 Starting seed for Long-Term Cohorts...');

    const lines = RAW_TSV_DATA.trim().split('\n');
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
        const row = parseRow(line);
        if (!row) {
            skippedCount++;
            continue;
        }

        const startDate = parseDateWithCorrection(row.startDateStr, undefined, row.id);
        const endDate = parseDateWithCorrection(row.endDateStr, startDate, row.id);

        const data = {
            name: row.name,
            status: row.status,
            cohortGroup: row.cohortGroup,
            cohortStartDate: startDate,
            cohortEndDate: endDate,
            totalParticipants: row.participants,
            cohortDuration: row.durationDays,
            cohortYear: row.year,
        };

        const result = await db.cohort.upsert({
            where: { id: row.id },
            create: {
                id: row.id,
                ...data
            },
            update: {
                ...data
            }
        });

        console.log(`✓ [Batch ${row.id}] ${row.name} (${row.cohortGroup}, ${row.year}) -> ${result.id}`);
        createdCount++;
    }

    console.log('\n======================================');
    console.log(`🎉 Finished Long-Term Cohort Seed:`);
    console.log(`   Processed: ${createdCount}`);
    console.log(`   Skipped:   ${skippedCount}`);
    console.log('======================================\n');
}

// Run directly if executed via tsx
seedLongtermCohorts()
    .catch((err) => {
        console.error('❌ Error during cohort seeding:', err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
