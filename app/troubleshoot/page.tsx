import { getTroubleshootingProducts } from '@/app/actions/troubleshooting';
import TroubleshootReport from './TroubleshootReport';

export const dynamic = 'force-dynamic';

export default async function TroubleshootingPage() {
    const { success, data: products, error } = await getTroubleshootingProducts();

    if (!success || !products) {
        return (
            <div className="p-8 text-center text-red-500">
                Error loading products: {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Troubleshooting Library
                </h1>
                <p className="text-gray-500 mt-2">Interactive Diagnostic Tool</p>
            </header>

            <TroubleshootReport products={products} />
        </div>
    );
}
