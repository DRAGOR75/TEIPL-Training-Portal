import { auth } from '@/auth';
import { db } from '@/lib/prisma';
import ManualPortal from '@/components/manuals/ManualPortal';
import AdminHeader from '@/components/admin/AdminHeader';

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

    // Fetch subjects: admin sees all, others see published only
    const subjects = await db.manualSubject.findMany({
        ...(isAdmin ? {} : { where: { userView: 1 } }),
        orderBy: { viewSeq: 'asc' },
    });

    // Module and topic libraries (for admin management + linking)
    const moduleLib = await db.manualModule.findMany({ orderBy: { viewSeq: 'asc' } });
    const topicLib = await db.manualTopic.findMany({ orderBy: { name: 'asc' } });

    // Learning paths
    let learningPaths: any[] = [];
    try {
        learningPaths = await db.learningPath.findMany({
            ...(isAdmin ? {} : { where: { status: 'Active' } }),
            orderBy: { createdAt: 'desc' },
            include: {
                subjects: {
                    orderBy: { seq: 'asc' },
                    include: {
                        subject: {
                            select: { id: true, name: true, imageUrl: true, keywords: true }
                        }
                    }
                }
            }
        });
    } catch (e) {
        // LearningPath table may not exist yet — gracefully fallback
        console.warn('Learning path tables not yet created:', e);
    }

    return (
        <>
            {isAdmin && <AdminHeader />}
            <ManualPortal
                subjects={subjects}
                moduleLib={moduleLib}
                topicLib={topicLib}
                learningPaths={learningPaths}
                isAdmin={isAdmin}
                userName={userName}
            />
        </>
    );
}
