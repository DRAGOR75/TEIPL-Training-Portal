'use client';

import { useState } from 'react';
import { TroubleshootingProduct, ProductFault, FaultLibrary, FaultCause, CauseLibrary } from '@prisma/client';
import { getFaultsForProduct, getCausesForFault } from '@/app/actions/troubleshooting';
import {
    Wrench,
    Search,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    BookOpen,
    HelpCircle,
    Info,
    Settings,
    Activity,
    ChevronRight,
    ClipboardList
} from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';

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
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Control Panel */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500">
                        <Settings size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Diagnostic Configuration</h2>
                        <p className="text-slate-500 text-sm font-medium">Configure parameters to generate troubleshooting steps</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Machine Selector */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                            <Wrench size={16} className="text-slate-400" />
                            Select Machine Model
                        </label>
                        <SearchableSelect
                            options={products.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedProductId}
                            onChange={(val) => handleProductChange(val)}
                            placeholder="-- Choose a Machine --"
                            searchPlaceholder="Search machines..."
                            icon={<Activity size={20} />}
                        />
                    </div>

                    {/* Issue Selector */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                            <AlertCircle size={16} className="text-slate-400" />
                            Select Observed Issue
                        </label>
                        <SearchableSelect
                            options={faults.map(f => ({
                                value: f.id,
                                label: `${f.fault.name} ${f.fault.faultCode ? `(${f.fault.faultCode})` : ''}`
                            }))}
                            value={selectedFaultId}
                            onChange={(val) => handleFaultChange(val)}
                            placeholder={loadingFaults ? 'Loading faults...' : '-- Choose an Issue --'}
                            searchPlaceholder="Search issues..."
                            disabled={!selectedProductId || loadingFaults}
                            icon={<Search size={20} />}
                        />
                        {faults.length === 0 && selectedProductId && !loadingFaults && (
                            <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium ml-1 bg-amber-50 w-fit px-2 py-1 rounded-md">
                                <Info size={12} /> No reported faults for this machine.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Diagnostic Report Area */}
            {loadingDiagnosis && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Generating Sequence</h3>
                    <p className="text-slate-500">Retrieving diagnostic data matching your selection...</p>
                </div>
            )}

            {!loadingDiagnosis && diagnosis && (
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Report Header - Professional Variant */}
                    <div className="bg-white p-8 border-b border-slate-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-700 border border-orange-100">
                                    <Activity size={12} className="mr-1.5" /> Troubleshooting Guide
                                </span>
                                {diagnosis.context.fault.faultCode && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                                        Code: {diagnosis.context.fault.faultCode}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-slate-900">
                                {diagnosis.context.fault.name}
                            </h2>
                            <div className="flex items-center gap-2 text-slate-500 font-medium text-lg">
                                <span className="opacity-70">Machine:</span>
                                <span className="text-slate-900 font-bold">{diagnosis.context.product.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Machine Specific Notes */}
                    {diagnosis.context.notes && (
                        <div className="p-6 md:p-8 bg-amber-50 border-b border-amber-100">
                            <div className="flex gap-4">
                                <div className="shrink-0">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                                        <AlertCircle size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-amber-900 font-bold text-sm uppercase tracking-wide mb-1">Important Product Note</h4>
                                    <p className="text-amber-900/80 leading-relaxed font-medium">
                                        {diagnosis.context.notes}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnostic Steps */}
                    <div className="p-3 md:p-6 bg-slate-50/50">
                        <div className="flex items-left gap-4 mb-8">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-orange-500">
                                <ClipboardList size={30} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900">Possible Causes and Remedies</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Follow the instructions</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {diagnosis.sequence.map((step, index) => (
                                <div key={step.id} className="relative pl-4 md:pl-6 group">

                                    {/* Timeline Connector */}
                                    <div
                                        className="absolute left-0 top-8 bottom-[-24px] w-0.5 bg-slate-200 group-last:hidden"
                                    ></div>

                                    {/* Step Number Badge */}
                                    <div className="absolute left-[-14px] md:left-[-12px] top-0 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-white border-2 border-orange-500 text-orange-500 flex items-center justify-center text-sm font-bold z-10 transition-transform group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Step Content Card */}
                                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 space-y-4">
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                                                        Check:  {step.cause.name}
                                                        {step.isLikely && (
                                                            <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-rose-200">
                                                                High Probability
                                                            </span>
                                                        )}
                                                    </h4>

                                                    {step.cause.description && (
                                                        <p className="text-slate-600 text-sm leading-relaxed mb-4 border-l-2 border-slate-200 pl-4 py-1">
                                                            {step.cause.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    {step.cause.action && (
                                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex gap-4">
                                                            <div className="shrink-0 mt-0.5">
                                                                <CheckCircle2 size={20} className="text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <span className="block text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                                                                    Recommended Action
                                                                </span>
                                                                <span className="text-slate-900 font-medium text-sm">
                                                                    {step.cause.action}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {step.cause.manualRef && (
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen size={14} className="text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">More Information:</span>
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-mono font-bold border border-slate-200">
                                                                {step.cause.manualRef}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Visual Aid */}
                                            {step.cause.imageUrl && (
                                                <div className="lg:col-span-1">
                                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group-hover:shadow-md transition-shadow">
                                                        <img
                                                            src={step.cause.imageUrl}
                                                            alt={step.cause.name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f1f5f9/94a3b8?text=Image+Unavailable';
                                                            }}
                                                        />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-xs font-medium flex items-center gap-1.5">
                                                                <Info size={12} /> Reference Image
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {diagnosis.sequence.length === 0 && (
                                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                                    <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No specific diagnostic steps documented for this issue yet.</p>
                                    <p className="text-slate-400 text-sm mt-1">Please consult the master technical manual directly.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State Instructions */}
            {!diagnosis && !loadingDiagnosis && selectedProductId && selectedFaultId && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                        <Search size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to Troubleshoot</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        System is ready. Confirm your selection above to load the diagnostic sequence.
                    </p>
                </div>
            )}

            {!selectedProductId && (
                <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-6 transform rotate-3">
                        <Wrench size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Start Troubleshooting</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8">
                        Select a machine model from the dropdown above to identify common faults and solutions.
                    </p>
                    <div className="flex justify-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Identify</span>
                        <span className="w-px h-4 bg-slate-300"></span>
                        <span className="flex items-center gap-1"><Search size={14} /> Diagnose</span>
                        <span className="w-px h-4 bg-slate-300"></span>
                        <span className="flex items-center gap-1"><Wrench size={14} /> Resolve</span>
                    </div>
                </div>
            )}
        </div>
    );
}
