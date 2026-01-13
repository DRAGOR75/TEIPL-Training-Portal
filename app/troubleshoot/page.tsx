import { getTroubleshootingProducts } from '@/app/actions/troubleshooting';
import TroubleshootReport from './TroubleshootReport';
import { BookOpen, Wrench } from 'lucide-react';

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
        <div className="container mx-auto p-6 md:p-8 max-w-7xl min-h-screen">
            <header className="mb-10 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200">
                        <Wrench size={20} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Troubleshooting Library
                    </h1>
                </div>
                <p className="text-slate-500 font-medium ml-[52px] max-w-2xl">
                    Interactive technical diagnostic tool for field technicians. Select a machine to begin the guided troubleshooting sequence.
                </p>
            </header>

            <TroubleshootReport products={products} />
        </div>
    );
}
