import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function MasterDataPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    // Redirect to the default tab
    redirect("/admin/tni-dashboard/subjects");
}
