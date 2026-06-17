import LocationManager from '@/components/admin/LocationManager';
import { getCachedAdminLocations } from '@/lib/cache-master-data';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function VenuesPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const locations = await getCachedAdminLocations();

    return <LocationManager locations={locations} />;
}
