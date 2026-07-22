import EmployeeManager from '@/components/admin/EmployeeManager';
import { getCachedAdminEmployees, getCachedAdminLocations, getCachedAdminSections } from '@/lib/cache-master-data';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const [employees, locations, sections] = await Promise.all([
        getCachedAdminEmployees(),
        getCachedAdminLocations(),
        getCachedAdminSections()
    ]);

    return <EmployeeManager employees={employees as any} locations={locations} sections={sections} />;
}
