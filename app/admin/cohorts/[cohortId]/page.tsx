import { getCohortById } from '@/app/actions/cohorts';
import { getTrainers } from '@/app/actions/trainers';
import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CohortDetailClient from './CohortDetailClient';

export const dynamic = 'force-dynamic';

export default async function CohortDetailPage({ params }: { params: Promise<{ cohortId: string }> }) {
    const { cohortId } = await params;

    const [cohort, trainers, locations] = await Promise.all([
        getCohortById(cohortId),
        getTrainers(),
        db.location.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    if (!cohort) {
        notFound();
    }

    return (
        <CohortDetailClient
            cohort={cohort}
            trainers={trainers}
            locations={locations}
        />
    );
}
