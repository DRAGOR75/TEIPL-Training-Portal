import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRegistrationRequests } from '@/app/actions/registration-requests';
import { getSections, getDesignations, getLocations } from '@/app/actions/master-data';
import RegistrationRequestsClient from '@/components/admin/RegistrationRequestsClient';

export const dynamic = 'force-dynamic';

export default async function RegistrationRequestsPage() {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        redirect('/login');
    }

    const [requestsData, sectionOptions, designationOptions, locationOptions] = await Promise.all([
        getRegistrationRequests('ALL'),
        getSections(),
        getDesignations(),
        getLocations()
    ]);

    return (
        <RegistrationRequestsClient
            initialRequests={requestsData.requests || []}
            counts={{
                pending: requestsData.pendingCount || 0,
                approved: requestsData.approvedCount || 0,
                rejected: requestsData.rejectedCount || 0,
                all: requestsData.allCount || 0
            }}
            sectionOptions={sectionOptions}
            designationOptions={designationOptions}
            locationOptions={locationOptions}
        />
    );
}

