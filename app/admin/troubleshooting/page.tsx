import { getAdminData } from '@/app/actions/admin-troubleshooting';
import AdminTabs from '@/components/admin/troubleshooting/AdminTabs';

export const dynamic = 'force-dynamic';

export default async function AdminTroubleshootingPage() {
    const { products, faultLib, causeLib } = await getAdminData();

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-2xl uppercase italic md:text-3xl font-black text-slate-900 tracking-tight">Troubleshooting <span className="text-red-500">Admin</span></h1>

            </div>

            <AdminTabs
                products={products}
                faultLib={faultLib}
                causeLib={causeLib}
            />
        </div>
    );
}
