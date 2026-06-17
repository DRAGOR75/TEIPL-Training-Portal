import SectionManager from '@/components/admin/SectionManager';
import { getCachedAdminSections } from '@/lib/cache-master-data';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const sections = await getCachedAdminSections();

    return <SectionManager sections={sections} />;
}
