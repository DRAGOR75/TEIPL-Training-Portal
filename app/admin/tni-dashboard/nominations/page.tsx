import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllNominations } from "@/app/actions/tni";
import AllNominationsClient from "./AllNominationsClient";


export const dynamic = 'force-dynamic';

export default async function AllNominationsPage() {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
        redirect("/api/auth/signin");
    }

    const nominations = await getAllNominations();

    return <AllNominationsClient nominations={nominations as any} />;
}
