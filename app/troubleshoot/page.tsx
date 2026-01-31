import { getTroubleshootingProducts } from '@/app/actions/troubleshooting';
import TroubleshootReport from './TroubleshootReport';
import Image from 'next/image';
import { HiOutlineWrench } from 'react-icons/hi2';

export const dynamic = 'force-dynamic';

export default async function TroubleshootingPage() {
    const { success, data: products, error } = await getTroubleshootingProducts();

    if (!success || !products) {
        return (
            <div className="p-12 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-100 mx-auto max-w-2xl mt-12">
                <p className="font-semibold">Error loading products library</p>
                <p className="text-sm mt-1 opacity-80">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen">

            <TroubleshootReport products={products} />
        </div>
    );
}
