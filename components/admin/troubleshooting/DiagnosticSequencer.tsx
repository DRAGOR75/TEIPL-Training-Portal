'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    getProductFaults,
    linkFaultToProduct,
    unlinkFaultFromProduct,
    updateProductFault,
    getSequence,
    addCauseToSequence,
    removeCauseFromSequence,
    toggleFaultCauseStatus, // New
    updateSequenceOrder,     // New
    updateCauseLibraryItem,   // New
    updateFaultCauseItem // New
} from '@/app/actions/admin-troubleshooting';
import {
    TroubleshootingProduct,
    FaultLibrary,
    ProductFault,
    CauseLibrary,
    FaultCause
} from '@prisma/client';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import {
    HiOutlineArrowRight,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineBars3,
    HiOutlineCheckCircle,
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineEye,
    HiOutlineEyeSlash
} from 'react-icons/hi2';

type FullProductFault = ProductFault & { fault: FaultLibrary };
type FullFaultCause = FaultCause & { cause: CauseLibrary; justification?: string | null };

interface DiagnosticSequencerProps {
    products: TroubleshootingProduct[];
    allFaults: FaultLibrary[];
    allCauses: CauseLibrary[];
}

// Helper Component for Sortable Item
function SortableStep({ step, index, onRemove, onToggle, onUpdate }: {
    step: FullFaultCause;
    index: number;
    onRemove: (id: string) => void;
    onToggle: (id: string, current: boolean) => void;
    onUpdate: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: step.id });

    const [isEditing, setIsEditing] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const,
    };

    async function handleSave(formData: FormData) {
        // Shared fields
        const libraryData = {
            name: formData.get('name') as string,
            action: formData.get('action') as string,
            symptoms: formData.get('symptoms') as string,
            manualRef: formData.get('manualRef') as string,
        };

        // Context specific field
        const justification = formData.get('justification') as string;

        const libraryRes = await updateCauseLibraryItem(step.cause.id, libraryData);
        const faultCauseRes = await updateFaultCauseItem(step.id, { justification });

        if (libraryRes?.error || faultCauseRes?.error) {
            alert(libraryRes?.error || faultCauseRes?.error);
        } else {
            setIsEditing(false);
            onUpdate();
        }
    }

    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} className="bg-white p-6 rounded-2xl border-2 border-blue-500 shadow-sm">
                <form action={handleSave} className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Check Description</label>
                        <input defaultValue={step.cause.name} name="name" className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Justification (Context Specific)</label>
                        <textarea defaultValue={step.justification || step.cause.justification || ''} name="justification" rows={2} className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Remedy</label>
                            <textarea defaultValue={step.cause.action || ''} name="action" rows={2} className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Symptoms</label>
                            <textarea defaultValue={step.cause.symptoms || ''} name="symptoms" rows={2} className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Manual Reference</label>
                        <input defaultValue={step.cause.manualRef || ''} name="manualRef" className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-slate-600 bg-white border border-slate-300 rounded text-xs">Cancel</button>
                        <FormSubmitButton className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Save Changes</FormSubmitButton>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} className={`bg-white p-5 rounded-2xl border shadow-sm group hover:border-blue-300 transition-all flex gap-4 ${!step.isActive ? 'opacity-60 grayscale border-slate-100' : 'border-slate-200'}`}>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step.isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {index + 1}
                    </span>
                    <h4 className={`font-bold text-sm ${step.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{step.cause.name}</h4>
                    {!step.isActive && <span className="text-[10px] uppercase bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Disabled</span>}
                </div>

                <p className="text-xs text-slate-600 mt-1 font-medium">{step.justification || step.cause.justification}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 pl-8">{step.cause.action}</p>
                {step.cause.manualRef && (
                    <span className="inline-block mt-2 ml-8 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-mono">
                        Ref: {step.cause.manualRef}
                    </span>
                )}
            </div>

            <div className="flex flex-col justify-between items-end pl-2 border-l border-slate-50">
                <div className="flex gap-1" onPointerDown={e => e.stopPropagation() /* Prevent Drag */}>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 transition"
                        title="Edit Details"
                    >
                        <HiOutlinePencil size={14} />
                    </button>
                    <button
                        onClick={() => onToggle(step.id, step.isActive)}
                        className={`p-1.5 rounded transition ${step.isActive ? 'text-slate-300 hover:text-slate-600' : 'text-slate-400 hover:text-green-600 bg-slate-100'}`}
                        title={step.isActive ? "Disable Step (Temp)" : "Enable Step"}
                    >
                        {step.isActive ? <HiOutlineEye size={14} /> : <HiOutlineEyeSlash size={14} />}
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Remove this step permanently?')) onRemove(step.id);
                        }}
                        className="text-slate-300 hover:text-red-500 p-1.5"
                        title="Remove Step"
                    >
                        <HiOutlineTrash size={14} />
                    </button>
                </div>

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="text-slate-300 hover:text-blue-500 cursor-move p-1.5"
                    title="Drag to reorder"
                >
                    <HiOutlineBars3 size={16} />
                </div>
            </div>
        </div>
    );
}

export default function DiagnosticSequencer({ products, allFaults, allCauses }: DiagnosticSequencerProps) {
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [linkedFaults, setLinkedFaults] = useState<FullProductFault[]>([]);
    const [loadingFaults, setLoadingFaults] = useState(false);

    // Edit Fault State
    const [editingFaultId, setEditingFaultId] = useState<string | null>(null);
    const [editFaultSeq, setEditFaultSeq] = useState(0);

    const [selectedProductFaultId, setSelectedProductFaultId] = useState<string | null>(null);
    const [sequence, setSequence] = useState<FullFaultCause[]>([]);
    const [loadingSequence, setLoadingSequence] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // State for SearchableSelects in forms
    const [linkFaultId, setLinkFaultId] = useState<string>('');
    const [addStepCauseId, setAddStepCauseId] = useState<string>('');

    // --- 1. Product & Linked Faults Logic ---

    // Update Fault
    async function handleUpdateFault(id: string) {
        const result = await updateProductFault(id, { viewSeq: editFaultSeq });
        if (result?.error) {
            alert(result.error);
        } else {
            setEditingFaultId(null);
            // Refresh
            if (selectedProductId) {
                const updated = await getProductFaults(selectedProductId);
                setLinkedFaults(updated);
            }
        }
    }

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
        if (!faultId) return;

        await linkFaultToProduct(selectedProductId, faultId);

        // Refresh
        const updated = await getProductFaults(selectedProductId);
        setLinkedFaults(updated);
        setIsAddingFault(false);
        setLinkFaultId(''); // Reset
    }

    // --- 2. Sequence Logic ---

    async function refreshSequence() {
        if (selectedProductFaultId) {
            setLoadingSequence(true);
            const data = await getSequence(selectedProductFaultId);
            setSequence(data);
            setLoadingSequence(false);
        }
    }

    useEffect(() => {
        refreshSequence();
    }, [selectedProductFaultId]);

    // Add Step to Sequence
    const [isAddingStep, setIsAddingStep] = useState(false);
    async function handleAddStep(formData: FormData) {
        if (!selectedProductFaultId) return;
        const causeId = formData.get('causeId') as string;
        if (!causeId) return;

        // Default seq is last + 1
        const nextSeq = sequence.length > 0 ? Math.max(...sequence.map(s => s.seq)) + 1 : 1;

        await addCauseToSequence(selectedProductFaultId, causeId, nextSeq);
        await refreshSequence();
        setIsAddingStep(false);
        setAddStepCauseId(''); // Reset
    }

    async function handleRemoveStep(id: string) {
        await removeCauseFromSequence(id);
        await refreshSequence();
    }

    async function handleToggleStep(id: string, current: boolean) {
        // Optimistic Update
        setSequence(prev => prev.map(s => s.id === id ? { ...s, isActive: !current } : s));
        await toggleFaultCauseStatus(id, !current); // Server action
        // No hard refresh needed if successful
    }

    // DnD Handler
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSequence((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Calculate new sequences (1-based)
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    seq: index + 1
                }));

                // Fire and forget server update (or await if critical)
                // We trust optimistic UI here for smoothness
                updateSequenceOrder(updates);

                return newItems;
            });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
            {/* LEFT PANE: Machine & Fault Selection */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Machine</label>
                        <SearchableSelect
                            options={products.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedProductId}
                            onChange={(val) => setSelectedProductId(parseInt(val))}
                            placeholder="-- Choose Machine --"
                            searchPlaceholder="Search machines..."
                        />
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
                                    <HiOutlinePlus size={14} /> Link Fault
                                </button>
                            </div>

                            {/* Add Fault Form */}
                            {isAddingFault && (
                                <div className="p-3 bg-blue-50 border-b border-blue-100">
                                    <form action={handleLinkFault} className="flex gap-2 items-start">
                                        <input type="hidden" name="faultId" value={linkFaultId} />
                                        <div className="flex-1">
                                            <SearchableSelect
                                                options={allFaults.map(f => ({ value: f.id, label: `${f.name} ${f.faultCode ? `(${f.faultCode})` : ''}` }))}
                                                value={linkFaultId}
                                                onChange={setLinkFaultId}
                                                placeholder="Select Fault..."
                                                searchPlaceholder="Search faults..."
                                                className="w-full"
                                            />
                                        </div>
                                        <FormSubmitButton className="px-3 py-3 bg-blue-600 text-white text-xs rounded h-full mt-0.5">Link</FormSubmitButton>
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
                                            onClick={() => { if (editingFaultId !== pf.id) setSelectedProductFaultId(pf.id) }}
                                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center ${selectedProductFaultId === pf.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                        >
                                            {editingFaultId === pf.id ? (
                                                <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="number"
                                                        value={editFaultSeq}
                                                        onChange={(e) => setEditFaultSeq(parseInt(e.target.value))}
                                                        className="w-16 p-1 border border-blue-300 rounded text-xs"
                                                        autoFocus
                                                    />
                                                    <span className="font-medium text-slate-700 flex-1 ml-2">{pf.fault.name}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleUpdateFault(pf.id)}
                                                            className="text-white bg-green-500 hover:bg-green-600 p-1 rounded shadow-sm"
                                                            title="Save"
                                                        >
                                                            <HiOutlineCheck size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingFaultId(null)}
                                                            className="text-slate-500 hover:text-slate-700 p-1"
                                                            title="Cancel"
                                                        >
                                                            <HiOutlineXMark size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-mono text-slate-400 w-6 text-center">{pf.viewSeq}</span>
                                                        <span className="font-medium text-slate-700">{pf.fault.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {selectedProductFaultId === pf.id && <HiOutlineArrowRight size={16} className="text-blue-500" />}

                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingFaultId(pf.id);
                                                                    setEditFaultSeq(pf.viewSeq);
                                                                }}
                                                                className="text-slate-400 hover:text-blue-600 p-1"
                                                                title="Edit Sequence"
                                                            >
                                                                <HiOutlinePencil size={14} />
                                                            </button>
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
                                                                title="Unlink"
                                                            >
                                                                <HiOutlineTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
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
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <HiOutlineCheckCircle size={18} className="text-green-600" />
                        Cause Manager (Sequence)
                    </h3>
                    <button
                        disabled={!selectedProductFaultId}
                        onClick={() => setIsAddingStep(true)}
                        className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium transition flex items-center gap-1 disabled:opacity-50"
                    >
                        <HiOutlinePlus size={14} /> Add Step
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                    {!selectedProductFaultId ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            &larr; Select a fault on the left to edit its sequence.
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={sequence.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div>
                                    {/* Add Step Form */}
                                    {isAddingStep && (
                                        <div className="mb-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-1">
                                            <form action={handleAddStep} className="space-y-3">
                                                <input type="hidden" name="causeId" value={addStepCauseId} />
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Select Check / Remedy</label>
                                                    <SearchableSelect
                                                        options={allCauses.map(c => ({ value: c.id, label: c.name }))}
                                                        value={addStepCauseId}
                                                        onChange={setAddStepCauseId}
                                                        placeholder="Select Check / Remedy..."
                                                        searchPlaceholder="Search causes..."
                                                        className="w-full mt-1"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setIsAddingStep(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                                                    <FormSubmitButton className="px-4 py-2 bg-green-600 text-white text-xs rounded-xl font-bold">Add Step</FormSubmitButton>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {loadingSequence ? (
                                        <div className="text-center py-8 text-slate-400">Loading sequence...</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {sequence.map((step, index) => (
                                                <SortableStep
                                                    key={step.id}
                                                    step={step}
                                                    index={index}
                                                    onRemove={handleRemoveStep}
                                                    onToggle={handleToggleStep}
                                                    onUpdate={refreshSequence}
                                                />
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
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}
