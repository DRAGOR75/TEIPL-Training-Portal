'use client';

import { useState } from 'react';
import { TroubleshootingProduct, ProductFault, FaultLibrary, FaultCause, CauseLibrary } from '@prisma/client';
import { getFaultsForProduct, getCausesForFault } from '@/app/actions/troubleshooting';

type FullProductFault = ProductFault & {
    fault: FaultLibrary;
};

type DiagnosisData = {
    context: ProductFault & { product: TroubleshootingProduct; fault: FaultLibrary };
    sequence: (FaultCause & { cause: CauseLibrary })[];
};

interface TroubleshootReportProps {
    products: TroubleshootingProduct[];
}

export default function TroubleshootReport({ products }: TroubleshootReportProps) {
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedFaultId, setSelectedFaultId] = useState<string | null>(null);

    const [faults, setFaults] = useState<FullProductFault[]>([]);
    const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);

    const [loadingFaults, setLoadingFaults] = useState(false);
    const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

    const handleProductChange = async (productId: string) => {
        const id = parseInt(productId);
        if (isNaN(id)) {
            setSelectedProductId(null);
            setFaults([]);
            setSelectedFaultId(null);
            setDiagnosis(null);
            return;
        }

        setSelectedProductId(id);
        setSelectedFaultId(null);
        setDiagnosis(null);
        setLoadingFaults(true);

        try {
            const { success, data } = await getFaultsForProduct(id);
            if (success && data) {
                setFaults(data);
            } else {
                setFaults([]); // Valid product but no faults or error
            }
        } catch (error) {
            console.error("Failed to load faults", error);
            setFaults([]);
        } finally {
            setLoadingFaults(false);
        }
    };

    const handleFaultChange = async (productFaultId: string) => {
        if (!productFaultId) {
            setSelectedFaultId(null);
            setDiagnosis(null);
            return;
        }

        setSelectedFaultId(productFaultId);
        setLoadingDiagnosis(true);

        try {
            const { success, data } = await getCausesForFault(productFaultId);
            if (success && data) {
                setDiagnosis(data as DiagnosisData);
            } else {
                setDiagnosis(null);
            }
        } catch (error) {
            console.error("Failed to load diagnosis", error);
            setDiagnosis(null);
        } finally {
            setLoadingDiagnosis(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Machine Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            1. Select Machine
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-gray-50 border"
                            value={selectedProductId?.toString() || ''}
                            onChange={(e) => handleProductChange(e.target.value)}
                        >
                            <option value="">-- Choose a Machine --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Issue Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            2. Select Issue
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-gray-50 border disabled:opacity-50 disabled:bg-gray-100"
                            value={selectedFaultId || ''}
                            onChange={(e) => handleFaultChange(e.target.value)}
                            disabled={!selectedProductId || loadingFaults}
                        >
                            <option value="">
                                {loadingFaults ? 'Loading faults...' : '-- Choose an Issue --'}
                            </option>
                            {faults.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.fault.name} {f.fault.faultCode ? `(${f.fault.faultCode})` : ''}
                                </option>
                            ))}
                        </select>
                        {faults.length === 0 && selectedProductId && !loadingFaults && (
                            <p className="text-xs text-orange-500 mt-1">No reported faults for this machine.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Diagnostic Report Area */}
            {loadingDiagnosis && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading diagnostic data...</p>
                </div>
            )}

            {!loadingDiagnosis && diagnosis && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Report Header */}
                    <div className="bg-blue-50/50 p-6 border-b border-blue-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {diagnosis.context.fault.name}
                                </h2>
                                <p className="text-blue-600 font-medium mt-1">
                                    {diagnosis.context.product.name}
                                    {diagnosis.context.fault.faultCode && <span className="text-gray-400 ml-2">#{diagnosis.context.fault.faultCode}</span>}
                                </p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Troubleshooting Guide
                                </span>
                            </div>
                        </div>

                        {/* Machine Specific Notes */}
                        {diagnosis.context.notes && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <h4 className="flex items-center text-sm font-semibold text-yellow-800 mb-1">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Machine Specific Note:
                                </h4>
                                <p className="text-sm text-yellow-800/80 ml-5">
                                    {diagnosis.context.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Diagnostic Steps */}
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Diagnostic Sequence</h3>

                        <div className="space-y-8">
                            {diagnosis.sequence.map((step, index) => (
                                <div key={step.id} className="relative pl-10">
                                    {/* Step Number Line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" style={{ display: index === diagnosis.sequence.length - 1 ? 'none' : 'block' }}></div>
                                    <div className="absolute left-[-11px] top-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold z-10 border-4 border-white">
                                        {index + 1}
                                    </div>

                                    {/* Step Content */}
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:border-blue-200 transition-colors">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <h4 className="text-base font-bold text-gray-900 mb-2">
                                                    Check: {step.cause.name}
                                                </h4>

                                                {step.cause.description && (
                                                    <div className="mb-4 text-sm text-gray-600">
                                                        {step.cause.description}
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    {step.cause.symptoms && (
                                                        <div className="flex gap-3 text-sm">
                                                            <span className="font-semibold text-gray-500 w-20 shrink-0">Symptoms:</span>
                                                            <span className="text-gray-700">{step.cause.symptoms}</span>
                                                        </div>
                                                    )}
                                                    {step.cause.action && (
                                                        <div className="flex gap-3 text-sm bg-green-50/50 p-2 rounded -mx-2">
                                                            <span className="font-semibold text-green-700 w-20 shrink-0">Remedy:</span>
                                                            <span className="text-gray-800">{step.cause.action}</span>
                                                        </div>
                                                    )}
                                                    {step.cause.manualRef && (
                                                        <div className="flex gap-3 text-xs mt-2">
                                                            <span className="font-semibold text-gray-400 w-20 shrink-0">Reference:</span>
                                                            <span className="text-blue-500 font-mono">{step.cause.manualRef}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step Image */}
                                            {step.cause.imageUrl && (
                                                <div className="lg:col-span-1">
                                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 border border-gray-200 shadow-sm group">
                                                        {/* Placeholder for real image since we just have string URLs in mock data usually */}
                                                        <img
                                                            src={step.cause.imageUrl}
                                                            alt={step.cause.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {diagnosis.sequence.length === 0 && (
                                <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg">
                                    No diagnostic steps documented for this issue yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!diagnosis && !loadingDiagnosis && selectedProductId && selectedFaultId && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Select an issue above to view diagnosis.</p>
                </div>
            )}
            {!selectedProductId && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Select a machine to start troubleshooting</p>
                </div>
            )}
        </div>
    );
}
