'use client';

import { useState, useEffect } from 'react';
import {
    getProductFaults,
    linkFaultToProduct,
    unlinkFaultFromProduct,
    getSequence,
    addCauseToSequence,
    removeCauseFromSequence
} from '@/app/actions/admin-troubleshooting';
import {
    TroubleshootingProduct,
    FaultLibrary,
    ProductFault,
    CauseLibrary,
    FaultCause
} from '@prisma/client';
import { FormSubmitButton } from '@/components/FormSubmitButton'; // Assuming existence
import { ArrowRight, Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

type FullProductFault = ProductFault & { fault: FaultLibrary };
type FullFaultCause = FaultCause & { cause: CauseLibrary };

interface DiagnosticSequencerProps {
    products: TroubleshootingProduct[];
    allFaults: FaultLibrary[];
    allCauses: CauseLibrary[];
}

export default function DiagnosticSequencer({ products, allFaults, allCauses }: DiagnosticSequencerProps) {
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [linkedFaults, setLinkedFaults] = useState<FullProductFault[]>([]);
    const [loadingFaults, setLoadingFaults] = useState(false);

    const [selectedProductFaultId, setSelectedProductFaultId] = useState<string | null>(null);
    const [sequence, setSequence] = useState<FullFaultCause[]>([]);
    const [loadingSequence, setLoadingSequence] = useState(false);

    // --- 1. Product & Linked Faults Logic ---

    useEffect(() => {
        if (selectedProductId) {
            setLoadingFaults(true);
            getProductFaults(selectedProductId).then((data) => {
                setLinkedFaults(data);
                setLoadingFaults(false);
                setSelectedProductFaultId(null);
                setSequence([]);
            });
        }
    }, [selectedProductId]);

    // Add Fault Link
    const [isAddingFault, setIsAddingFault] = useState(false);
    async function handleLinkFault(formData: FormData) {
        if (!selectedProductId) return;
        const faultId = formData.get('faultId') as string;
        await linkFaultToProduct(selectedProductId, faultId);

        // Refresh
        const updated = await getProductFaults(selectedProductId);
        setLinkedFaults(updated);
        setIsAddingFault(false);
    }

    // --- 2. Sequence Logic ---

    useEffect(() => {
        if (selectedProductFaultId) {
            setLoadingSequence(true);
            getSequence(selectedProductFaultId).then((data) => {
                setSequence(data);
                setLoadingSequence(false);
            });
        }
    }, [selectedProductFaultId]);

    // Add Step to Sequence
    const [isAddingStep, setIsAddingStep] = useState(false);
    async function handleAddStep(formData: FormData) {
        if (!selectedProductFaultId) return;
        const causeId = formData.get('causeId') as string;
        // Default seq is last + 1
        const nextSeq = sequence.length > 0 ? Math.max(...sequence.map(s => s.seq)) + 1 : 1;

        await addCauseToSequence(selectedProductFaultId, causeId, nextSeq);

        // Refresh
        const updated = await getSequence(selectedProductFaultId);
        setSequence(updated);
        setIsAddingStep(false);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
            {/* LEFT PANE: Machine & Fault Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Machine</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                            onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
                            value={selectedProductId || ''}
                        >
                            <option value="">-- Choose Machine --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {!selectedProductId ? (
                        <div className="p-8 text-center text-slate-400">Select a machine linked faults.</div>
                    ) : (
                        <div>
                            <div className="p-3 bg-slate-100 text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                                <span>Linked Faults</span>
                                <button onClick={() => setIsAddingFault(true)} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    <Plus size={14} /> Link Fault
                                </button>
                            </div>

                            {/* Add Fault Form */}
                            {isAddingFault && (
                                <div className="p-3 bg-blue-50 border-b border-blue-100">
                                    <form action={handleLinkFault} className="flex gap-2">
                                        <select name="faultId" className="flex-1 text-sm border-blue-200 rounded p-1">
                                            {allFaults.map(f => (
                                                <option key={f.id} value={f.id}>{f.name} {f.faultCode ? `(${f.faultCode})` : ''}</option>
                                            ))}
                                        </select>
                                        <FormSubmitButton className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Link</FormSubmitButton>
                                    </form>
                                </div>
                            )}

                            {loadingFaults ? (
                                <div className="p-4 text-center text-slate-400">Loading faults...</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {linkedFaults.map(pf => (
                                        <div
                                            key={pf.id}
                                            onClick={() => setSelectedProductFaultId(pf.id)}
                                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center ${selectedProductFaultId === pf.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                        >
                                            <span className="font-medium text-slate-700">{pf.fault.name}</span>
                                            <div className="flex items-center gap-2">
                                                {selectedProductFaultId === pf.id && <ArrowRight size={16} className="text-blue-500" />}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Unlink this fault?')) {
                                                            unlinkFaultFromProduct(pf.id).then(() => {
                                                                getProductFaults(selectedProductId!).then(setLinkedFaults);
                                                            })
                                                        }
                                                    }}
                                                    className="text-slate-300 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {linkedFaults.length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-sm">No faults linked to this machine yet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Diagnostic Sequence */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-600" />
                        Diagnostic Sequence
                    </h3>
                    <button
                        disabled={!selectedProductFaultId}
                        onClick={() => setIsAddingStep(true)}
                        className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1 disabled:opacity-50"
                    >
                        <Plus size={14} /> Add Step
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                    {!selectedProductFaultId ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            &larr; Select a fault on the left to edit its sequence.
                        </div>
                    ) : (
                        <div>
                            {/* Add Step Form */}
                            {isAddingStep && (
                                <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm animate-in slide-in-from-top-1">
                                    <form action={handleAddStep} className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Select Check / Remedy</label>
                                            <select name="causeId" className="w-full mt-1 p-2 border border-slate-300 rounded text-sm">
                                                {allCauses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setIsAddingStep(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                                            <FormSubmitButton className="px-3 py-1.5 bg-green-600 text-white text-xs rounded font-bold">Add Step</FormSubmitButton>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {loadingSequence ? (
                                <div className="text-center py-8 text-slate-400">Loading sequence...</div>
                            ) : (
                                <div className="space-y-3">
                                    {sequence.map((step, index) => (
                                        <div key={step.id} className="relative pl-8 group">
                                            {/* Connector Line */}
                                            {index < sequence.length - 1 && (
                                                <div className="absolute left-[15px] top-8 bottom-[-12px] w-0.5 bg-slate-200"></div>
                                            )}

                                            {/* Number Badge */}
                                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm z-10">
                                                {index + 1}
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group-hover:border-blue-300 transition-colors flex gap-4">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800 text-sm">{step.cause.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{step.cause.action}</p>
                                                    {step.cause.manualRef && (
                                                        <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-mono">
                                                            Ref: {step.cause.manualRef}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col justify-between items-end">
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Remove this step?')) {
                                                                removeCauseFromSequence(step.id).then(() => {
                                                                    getSequence(selectedProductFaultId).then(setSequence);
                                                                })
                                                            }
                                                        }}
                                                        className="text-slate-300 hover:text-red-500 p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    {/* Reorder Placeholder */}
                                                    <div className="text-slate-300 cursor-move" title="Drag to reorder (Coming soon)">
                                                        <GripVertical size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {sequence.length === 0 && (
                                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400">
                                            No diagnostic steps defined yet.
                                            <br />
                                            <button onClick={() => setIsAddingStep(true)} className="text-blue-500 hover:underline mt-2 text-sm">Add First Step</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
