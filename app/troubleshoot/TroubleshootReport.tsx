'use client';

import { useState } from 'react';
import { TroubleshootingProduct, ProductFault, FaultLibrary, FaultCause, CauseLibrary } from '@prisma/client';
import { getFaultsForProduct, getCausesForFault, logTroubleshootingEvent } from '@/app/actions/troubleshooting';
import {
    HiOutlineWrench,
    HiOutlineMagnifyingGlass,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle,
    HiOutlineArrowRight,
    HiOutlineBookOpen,
    HiOutlineQuestionMarkCircle,
    HiOutlineInformationCircle,
    HiOutlineCog6Tooth,
    HiOutlineBolt,
    HiOutlineChevronRight,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineClipboardDocumentList,
    HiOutlineChatBubbleLeftRight,
    HiOutlineXMark
} from 'react-icons/hi2';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Link from 'next/link';
import FormatList from '@/components/ui/FormatList';

type FullProductFault = ProductFault & {
    fault: FaultLibrary;
};

type DiagnosisData = {
    context: ProductFault & { product: TroubleshootingProduct; fault: FaultLibrary };
    sequence: (FaultCause & { cause: CauseLibrary; justification?: string | null })[];
};

interface TroubleshootReportProps {
    products: TroubleshootingProduct[];
}

import TroubleshootingFeedbackModal from '@/components/TroubleshootingFeedbackModal';
import LoadingSpinner from '@/components/troubleshoot/LoadingSpinner';

export default function TroubleshootReport({ products }: TroubleshootReportProps) {
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedFaultId, setSelectedFaultId] = useState<string | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    const [faults, setFaults] = useState<FullProductFault[]>([]);
    const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);

    const [loadingFaults, setLoadingFaults] = useState(false);
    const [loadingDiagnosis, setLoadingDiagnosis] = useState<boolean>(false);
    const [activeModalStep, setActiveModalStep] = useState<any | null>(null);
    const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

    // State for collapsible steps and symptoms
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
    const [isSymptomsExpanded, setIsSymptomsExpanded] = useState(false);

    const toggleStep = (index: number) => {
        setExpandedSteps(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

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

    const [showGuide, setShowGuide] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleFeedbackNav = () => {
        setIsNavigating(true);
        // Navigate to feedback page after showing spinner
        window.location.href = '/feedback';
    };

    return (
        <div className="space-y-4 md:space-y-9 w-full mx-auto px-1 md:px-0">
            {isNavigating && <LoadingSpinner />}

            {/* Cause Details Modal (Card Style) */}
            {activeModalStep && (
                <div className="fixed inset-0 w-screen h-[100dvh] z-[999] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4 sm:p-6" onClick={() => { setActiveModalStep(null); setActiveModalIndex(null); }}>
                    <div
                        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-12 duration-500"
                        style={{ animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-white/95 backdrop-blur-sm z-10 px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0 shadow-sm">
                            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                {activeModalIndex !== null && (
                                    <span className="w-7 h-7 rounded-full bg-blue-50 text-thriveni-blue border border-blue-100 flex items-center justify-center text-sm shadow-inner">
                                        {activeModalIndex + 1}
                                    </span>
                                )}
                                Diagnostic Details
                            </h3>
                            <button onClick={() => { setActiveModalStep(null); setActiveModalIndex(null); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                                <HiOutlineXMark size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/30">
                            {/* Cause Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <FormatList label="Cause" text={activeModalStep.cause.name} className="text-xl font-bold text-slate-900 leading-snug" />
                            </div>

                            {/* Remedy Section */}
                            {activeModalStep.cause.action && (
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                                            <HiOutlineClipboardDocumentList size={18} />
                                        </div>
                                        <h4 className="font-black text-blue-900 tracking-wide uppercase text-sm">Remedy / Action</h4>
                                    </div>
                                    <div className="text-slate-800 text-base md:text-lg leading-relaxed">
                                        <FormatList text={activeModalStep.cause.action} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 md:p-6 border-t border-slate-100 shrink-0 bg-white">
                            <button onClick={() => { setActiveModalStep(null); setActiveModalIndex(null); }} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guideline Modal Overlay */}
            {showGuide && (
                <div className="fixed inset-0 w-screen h-[100dvh] z-[999] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col">
                        <div className="sticky top-0 bg-white z-10 px-4 py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-thriveni-blue/10 p-2 md:p-2.5 rounded-lg md:rounded-xl text-thriveni-blue">
                                    <HiOutlineBookOpen size={20} className="stroke-[2.5]" />
                                </div>
                                <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">Troubleshooting Guidelines</h2>
                            </div>
                        </div>
                        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
                            <ol className="space-y-2 md:space-y-3">
                                {[
                                    "Get all the facts concerning the complaint",
                                    "Analyse the problem thoroughly",
                                    "Relate the symptoms to the basic engine / genset systems and components",
                                    "Consider any recent maintenance or repair action that can relate to the complaint",
                                    "Double-check before beginning any disassembly",
                                    "Solve the problem by using the symptom charts and doing the easiest things first",
                                    "Determine the cause of the problem and make a thorough repair",
                                    "After repairs have been made, operate the machine to make sure the cause of the complaint has been corrected."
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-2 md:gap-3 text-slate-700 text-sm md:text-base font-medium leading-relaxed bg-slate-50 p-2.5 md:p-3 rounded-lg border border-slate-100">
                                        <span className="flex-shrink-0 w-6 h-6 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold shadow-sm mt-0.5">
                                            {idx + 1}
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ol>
                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="bg-thriveni-blue text-white px-8 py-2.5 rounded-xl font-bold hover:bg-thriveni-light transition-all shadow-lg"
                                >
                                    Close Troubleshooting Guidelines
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Disclaimer Modal Overlay */}
            {showDisclaimer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-xl w-full animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col">
                        <div className="bg-white px-4 py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500/10 p-2 md:p-2.5 rounded-lg md:rounded-xl text-amber-600">
                                    <HiOutlineExclamationCircle size={20} className="stroke-[2.5]" />
                                </div>
                                <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">User Guidelines</h2>
                            </div>
                        </div>
                        <div className="p-4 md:p-8 space-y-4">
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                                Step 1: Select the machine you want to troubleshoot.
                            </p>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                                Step 2: Select the fault you want to troubleshoot.
                            </p>

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={() => setShowDisclaimer(false)}
                                    className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                                >
                                    Understood
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal Overlay */}
            {showFeedbackModal && (
                <TroubleshootingFeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                />
            )}

            {/* Main Content Wrapper (Occupies full space to push footer to bottom) */}
            <div className="flex-1 flex flex-col gap-4 md:gap-9">

                {/* Control Panel (Always top) */}
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-3xl shadow-sm border border-slate-200">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Machine Selector */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                                <HiOutlineWrench size={16} className="text-slate-400" />
                                Select Machine Model
                            </label>
                            <SearchableSelect
                                options={products.map(p => ({ value: p.id, label: p.name }))}
                                value={selectedProductId}
                                onChange={(val) => handleProductChange(val)}
                                placeholder="-- Choose a Machine --"
                                searchPlaceholder="Search machines..."
                                icon={<HiOutlineMagnifyingGlass size={20} />}
                                direction="down"
                            />
                        </div>

                        {/* Issue Selector */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                                <HiOutlineExclamationCircle size={16} className="text-slate-400" />
                                Select Observed  Fault
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
                                icon={<HiOutlineMagnifyingGlass size={20} />}
                                direction="down"
                            />
                            {faults.length === 0 && selectedProductId && !loadingFaults && (
                                <p className="flex items-center gap-1.5 text-xs text-lloyds-red font-medium ml-1 bg-lloyds-red/10 w-fit px-2 py-1 rounded-md">
                                    <HiOutlineInformationCircle size={12} /> No reported faults for this machine.
                                </p>
                            )}
                        </div>
                    </div>
                </div>



                {/* Diagnostic Content (Always below selectors) */}
                <div className="space-y-4 md:space-y-9">

                    {/* Diagnostic Report Area */}
                    {loadingDiagnosis && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-12 text-center">
                            <div className="relative w-16 h-16 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-thriveni-blue rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Generating Sequence</h3>
                            <p className="text-slate-500">Retrieving diagnostic data matching your selection...</p>
                        </div>
                    )}

                    {!loadingDiagnosis && diagnosis && (
                        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">



                            {/* Machine Specific Notes */}
                            {diagnosis.context.notes && (
                                <div className="p-4 md:p-8 bg-lloyds-red/5 border-b border-lloyds-red/10">
                                    <div className="flex gap-4">
                                        <div className="shrink-0">
                                            <div className="w-10 h-10 bg-lloyds-red/10 rounded-full flex items-center justify-center text-lloyds-red shadow-sm border border-lloyds-red/20">
                                                <HiOutlineExclamationCircle size={20} />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-lloyds-red font-bold text-sm uppercase tracking-wide mb-1">Important Product Note</h4>
                                            <p className="text-lloyds-red/80 leading-relaxed font-medium">
                                                {diagnosis.context.notes}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Symptoms Section */}
                            {(() => {
                                // Extract and split symptoms more robustly
                                const rawSymptoms = (diagnosis.context as any).symptoms;
                                if (!rawSymptoms) return null;

                                const allSymptoms = Array.from(new Set(
                                    [rawSymptoms]
                                        .filter(Boolean)
                                        .flatMap(s => {
                                            if (/\d+\./.test(s!)) {
                                                return s!.split(/\s*(?=\d+\.)/).map((item: string) => item.trim());
                                            }
                                            return s!.split(',').map((item: string) => item.trim());
                                        })
                                        .filter((item: string) => item.length > 2)
                                ));

                                if (allSymptoms.length === 0) return null;

                                return (
                                    <div className="border-b border-slate-100 bg-white">
                                        <button
                                            onClick={() => setIsSymptomsExpanded(!isSymptomsExpanded)}
                                            className="w-full flex items-center justify-between p-4 md:p-8 pr-4 md:pr-16 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
                                                    <HiOutlineInformationCircle size={22} />
                                                </div>
                                                <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wide">Observed Symptoms ({allSymptoms.length})</h4>
                                            </div>
                                            <div className={`text-slate-400 transition-transform duration-300 ${isSymptomsExpanded ? 'rotate-180' : ''}`}>
                                                <HiOutlineChevronDown size={20} />
                                            </div>
                                        </button>

                                        {isSymptomsExpanded && (
                                            <div className="px-4 md:px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <ul className="space-y-3">
                                                    {allSymptoms.map((symptom, i) => (
                                                        <li key={i} className="flex gap-3 text-slate-700 text-sm md:text-base leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2"></span>
                                                            {symptom}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Diagnostic Steps */}
                            <div className="p-2 md:p-8 bg-slate-50/50">
                                <div className="flex items-left gap-3 md:gap-4 mb-6 md:mb-8 pl-2 md:pl-0">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-thriveni-blue">
                                        <HiOutlineClipboardDocumentList size={30} />
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold uppercase tracking-wider text-slate-900">
                                            Possible Causes ({diagnosis.sequence.length})
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {diagnosis.sequence.map((step, index) => (
                                        <div key={step.id} className="relative pl-14 md:pl-16 group">

                                            {/* Timeline Connector */}
                                            <div
                                                className="absolute left-7 top-12 bottom-[-24px] w-0.5 bg-slate-200 group-last:hidden"
                                            ></div>

                                            {/* Step Number Badge */}
                                            <div className="absolute left-3 top-4">
                                                <div className="w-8 h-8 rounded-full bg-white border-2 border-thriveni-blue text-thriveni-blue flex items-center justify-center text-sm font-bold z-10 shadow-sm transition-transform group-hover:scale-110 group-hover:bg-thriveni-blue group-hover:text-white">
                                                    {index + 1}
                                                </div>
                                            </div>

                                            {/* Step Content Card */}
                                            <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-thriveni-blue/30 transition-all duration-300">
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                    <div className={`${step.cause.imageUrl ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                                                        <div
                                                            onClick={() => { setActiveModalStep(step); setActiveModalIndex(index); }}
                                                            className="cursor-pointer select-none group"
                                                        >
                                                            <div className="flex items-center justify-between gap-4 w-full">
                                                                <div className="flex-1 text-sm md:text-base text-slate-900 flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2 group-hover:text-thriveni-blue transition-colors">
                                                                    <div className="font-bold flex-1">
                                                                        <FormatList label="Cause" text={step.cause.name} />
                                                                    </div>
                                                                    {step.isLikely && (
                                                                        <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-rose-200 shrink-0">
                                                                            High Probability
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-slate-400 group-hover:text-thriveni-blue transition-colors duration-300">
                                                                    <HiOutlineChevronRight size={22} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {diagnosis.sequence.length === 0 && (
                                        <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
                                            <HiOutlineQuestionMarkCircle size={48} className="mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-500 font-medium">No specific diagnostic steps documented for this issue yet.</p>
                                            <p className="text-slate-400 text-sm mt-1">Please consult the master technical manual directly.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback Link */}
                    {diagnosis && !loadingDiagnosis && (
                        <div className="text-center mt-8 pb-8">
                            <p className="text-slate-500 mb-2">Did this help you solve the issue?</p>
                            <button
                                onClick={handleFeedbackNav}
                                className="inline-flex items-center gap-2 text-lloyds-red font-bold hover:underline"
                            >
                                <HiOutlineChatBubbleLeftRight size={18} />
                                Give Feedback
                            </button>
                        </div>
                    )}

                    {/* Empty State Instructions */}
                    {!diagnosis && !loadingDiagnosis && selectedProductId && selectedFaultId && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-12 text-center shadow-sm">
                            <div className="w-16 h-16 bg-thriveni-blue/5 rounded-full flex items-center justify-center text-thriveni-blue mx-auto mb-4">
                                <HiOutlineMagnifyingGlass size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to Troubleshoot</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                System is ready. Confirm your selection above to load the diagnostic sequence.
                            </p>
                        </div>
                    )}

                    {!selectedProductId && (
                        <>
                            <div className="bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 p-8 md:p-20 text-justify">
                                <p className="text-slate-500 max-w-md mx-auto mb-2 text-sm leading-relaxed">
                                    <strong>Caution :</strong> <span className="text-lloyds-red">This troubleshooting library provides only quick guidelines and is intended as a reference for technicians who possess comprehensive knowledge of the machines. For detailed instructions, safety guidelines, and complete procedures, please refer to the manufacturer’s official manuals.</span>
                                </p>
                            </div>

                            {/* Secondary Navigation Row (Guidelines, Disclaimer, Feedback) - Only on landing */}
                            <div className="px-2 md:px-4">
                                <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl md:rounded-[2rem] p-3 md:p-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                                    <button
                                        onClick={() => setShowGuide(true)}
                                        className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-slate-500 hover:text-thriveni-blue transition-all group"
                                    >
                                        <div className="p-1.5 bg-slate-50 group-hover:bg-thriveni-blue/10 rounded-lg transition-colors">
                                            <HiOutlineBookOpen size={16} />
                                        </div>
                                        Troubleshooting Guidelines
                                    </button>
                                    <button
                                        onClick={() => setShowDisclaimer(true)}
                                        className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-thriveni-blue transition-colors group"
                                    >
                                        <div className="p-1.5 bg-slate-50 group-hover:bg-thriveni-blue/10 rounded-lg transition-colors">
                                            <HiOutlineExclamationCircle size={16} />
                                        </div>
                                        User guidelines
                                    </button>
                                    <button
                                        onClick={handleFeedbackNav}
                                        className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-thriveni-blue transition-colors group"
                                    >
                                        <div className="p-1.5 bg-slate-50 group-hover:bg-thriveni-blue/10 rounded-lg transition-colors">
                                            <HiOutlineChatBubbleLeftRight size={16} />
                                        </div>
                                        Feedback
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
