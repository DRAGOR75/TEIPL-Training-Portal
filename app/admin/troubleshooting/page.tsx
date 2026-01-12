import { getAdminData } from '@/app/actions/admin-troubleshooting';
import AdminTabs from '@/components/admin/troubleshooting/AdminTabs';

export const dynamic = 'force-dynamic';

export default async function AdminTroubleshootingPage() {
    const { products, faultLib, causeLib } = await getAdminData();

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Troubleshooting Admin</h1>
                <p className="text-slate-500">Manage machines, fault codes, and diagnostic sequences.</p>
            </div>

            <AdminTabs
                products={products}
                faultLib={faultLib}
                causeLib={causeLib}
            />
        </div>
    );
}
