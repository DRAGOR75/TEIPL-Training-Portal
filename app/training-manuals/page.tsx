import { auth } from '@/auth';
import { db } from '@/lib/prisma';
import ManualPortal from '@/components/manuals/ManualPortal';
import AdminHeader from '@/components/admin/AdminHeader';
import { 
    getCachedManualSubjects, 
    getCachedManualTree, 
    getCachedModuleLib, 
    getCachedTopicLib, 
    getCachedLearningPaths 
} from '@/lib/cache-manuals';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Training Manuals — Portal',
    description: 'Browse and manage training manuals, modules, topics, and learning paths.',
};

export default async function TrainingManualsPage() {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === 'ADMIN';
    const userName = session?.user?.name || undefined;

    // Fetch data using cached wrappers
    const subjects = await getCachedManualSubjects(isAdmin);
    const fullTree = await getCachedManualTree(isAdmin);
    const moduleLib = await getCachedModuleLib();
    const topicLib = await getCachedTopicLib();
    const learningPaths = await getCachedLearningPaths(isAdmin);

    return (
        <>
            {isAdmin && <AdminHeader />}
            <ManualPortal
                subjects={subjects}
                fullTree={fullTree}
                moduleLib={moduleLib}
                topicLib={topicLib}
                learningPaths={learningPaths}
                isAdmin={isAdmin}
                userName={userName}
            />
        </>
    );
}
