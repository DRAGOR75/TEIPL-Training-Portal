import { getTroubleshootingProducts } from '@/app/actions/troubleshooting';
import TroubleshootReport from './TroubleshootReport';
import { BookOpen, Wrench } from 'lucide-react';
import Image from 'next/image';

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
        <div className="container mx-auto p-4 md:p-8 max-w-7xl min-h-screen">
            <header className="mb-6 md:mb-10 border-b border-slate-200 pb-4 md:pb-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative w-24 h-12 md:w-32 md:h-16">
                            <Image
                                src="/thriveny_logo.svg"
                                alt="Thriveni Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="h-8 w-[1px] bg-slate-300 mx-1"></div>
                        <div className="relative w-28 h-8 md:w-34 md:h-10">
                            <Image
                                src="/LLoyds_logo.svg"
                                alt="Lloyds Metals Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-1 md:mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200 shrink-0">
                        <Wrench size={18} className="md:w-5 md:h-5" />
                    </div>
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        Troubleshooting Library
                    </h1>
                </div>
            </header>

            <TroubleshootReport products={products} />
        </div>
    );
}
