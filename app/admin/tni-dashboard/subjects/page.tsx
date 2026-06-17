import ProgramManager from '@/components/admin/ProgramManager';
import { getCachedAdminPrograms, getCachedAdminSections } from '@/lib/cache-master-data';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const [programs, sections] = await Promise.all([
        getCachedAdminPrograms(),
        getCachedAdminSections()
    ]);

    return <ProgramManager programs={programs} allSections={sections} />;
}
