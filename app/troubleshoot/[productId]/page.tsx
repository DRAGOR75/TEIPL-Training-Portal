import { getFaultsForProduct } from '@/app/actions/troubleshooting';
import Link from 'next/link';
import { ProductFault, FaultLibrary } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ProductTroubleshootPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const id = parseInt(productId);

    if (isNaN(id)) return <div>Invalid Product ID</div>;

    const { success, data: productFaults, error } = await getFaultsForProduct(id);

    if (!success) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    // Group faults or just list them? Listing them for now as per design.
    // Maybe add client-side search later.

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="mb-6">
                <Link href="/troubleshoot" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    ← Back to Products
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Diagnose Issues
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {productFaults && productFaults.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {productFaults.map((pf: ProductFault & { fault: FaultLibrary }) => (
                            <Link
                                key={pf.id}
                                href={`/troubleshoot/diagnosis/${pf.id}`}
                                className="block p-4 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 group-hover:text-blue-700">
                                        {pf.fault.name}
                                    </h3>
                                    {pf.fault.faultCode && (
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                            {pf.fault.faultCode}
                                        </span>
                                    )}
                                </div>
                                <div className="text-gray-400 group-hover:text-blue-500">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No common faults found for this machine.
                    </div>
                )}
            </div>
        </div>
    );
}
