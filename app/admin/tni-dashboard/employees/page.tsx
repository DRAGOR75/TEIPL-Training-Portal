import EmployeeManager from '@/components/admin/EmployeeManager';
import { getCachedAdminEmployees } from '@/lib/cache-master-data';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const employees = await getCachedAdminEmployees();

    return <EmployeeManager employees={employees as any} />;
}
