import SystemSettingsManager from '@/components/admin/SystemSettingsManager';
import { getSystemSetting } from '@/app/actions/settings';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const isTniEnabledStr = await getSystemSetting('enable_employee_tni_add', 'true');
    const isTniEnabled = isTniEnabledStr === 'true';

    return <SystemSettingsManager initialTniEnabled={isTniEnabled} />;
}
