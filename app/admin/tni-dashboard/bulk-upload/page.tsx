import BulkUploadManager from '@/components/admin/BulkUploadManager';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function BulkUploadPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    return <BulkUploadManager />;
}
