'use client';

import { useState, useRef, useEffect } from 'react';
import { createTroubleshootingProduct, deleteTroubleshootingProduct, updateTroubleshootingProduct, reorderProducts, toggleProductStatus } from '@/app/actions/admin-troubleshooting';
import { FormSubmitButton } from '@/components/FormSubmitButton'; // Assuming we have this
import { Trash2, Plus, Box, Edit2, Check, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { TroubleshootingProduct } from '@prisma/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableProductRow({ p, editingId, editSeq, editName, setEditSeq, setEditName, handleUpdate, setEditingId, startEdit, deleteProduct, toggleStatus }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: p.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? 'relative' as const : undefined,
        backgroundColor: isDragging ? '#f8fafc' : undefined,
        boxShadow: isDragging ? '0 5px 15px -5px rgba(0, 0, 0, 0.1)' : undefined,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`hover:bg-slate-50 group transition-colors border-b border-slate-50 last:border-0 ${isDragging ? 'opacity-80' : ''} ${p.userView === 0 ? 'opacity-50 bg-slate-50' : ''}`}
        >
            {editingId === p.id ? (
                <>
                    <td className="px-4 py-3 bg-white">
                        <input
                            type="number"
                            value={editSeq}
                            onChange={(e) => setEditSeq(parseInt(e.target.value))}
                            className="w-16 p-2 border border-blue-300 rounded-xl text-xs"
                        />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 bg-white">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 border border-blue-300 rounded-xl text-sm"
                            autoFocus
                        />
                    </td>
                    <td className="px-4 py-3 text-right bg-white">
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleUpdate(p.id)}
                                className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-sm"
                                title="Save"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="text-slate-500 hover:text-slate-700 p-1"
                                title="Cancel"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </td>
                </>
            ) : (
                <>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        <div className="flex items-center gap-3">
                            <button {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                <GripVertical size={14} />
                            </button>
                            {p.viewSeq}
                        </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => toggleStatus(p.id, p.userView)}
                                className={`transition p-1 ${p.userView === 1 ? 'text-blue-400 hover:text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}
                                title={p.userView === 1 ? 'Disable' : 'Enable'}
                            >
                                {p.userView === 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button
                                onClick={() => startEdit(p)}
                                className="text-slate-400 hover:text-blue-600 transition p-1"
                                title="Edit"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id) }}
                                className="text-slate-300 hover:text-red-600 transition p-1"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                </>
            )}
        </tr>
    );
}

export default function ProductManager({ products }: { products: TroubleshootingProduct[] }) {
    // Local state for optimistic updates
    const [localProducts, setLocalProducts] = useState(products);

    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    const formRef = useRef<HTMLFormElement>(null);
    const [isAdding, setIsAdding] = useState(false);

    // -- DnD Sensors --
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // -- Handle Drag --
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalProducts((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Calculate new viewSeqs
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    viewSeq: index + 1
                }));

                // Call Server Action
                reorderProducts(updates);

                // Optimistic Update
                return newItems.map((item, index) => ({ ...item, viewSeq: index + 1 }));
            });
        }
    }

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editSeq, setEditSeq] = useState(0);

    async function handleAdd(formData: FormData) {
        const result = await createTroubleshootingProduct(formData);
        if (result?.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
            setIsAdding(false);
        }
    }

    async function handleUpdate(id: number) {
        const result = await updateTroubleshootingProduct(id, { name: editName, viewSeq: editSeq });
        if (result?.error) {
            alert(result.error);
        } else {
            setEditingId(null);
        }
    }

    const startEdit = (product: TroubleshootingProduct) => {
        setEditingId(product.id);
        setEditName(product.name);
        setEditSeq(product.viewSeq);
    };

    async function toggleStatus(id: number, currentStatus: number) {
        // Optimistic
        setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, userView: currentStatus === 1 ? 0 : 1 } : p));

        const result = await toggleProductStatus(id, currentStatus);
        if (result?.error) {
            alert(result.error);
            // Revert
            setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, userView: currentStatus } : p));
        }
    }

    async function handleDelete(id: number) {
        const result = await deleteTroubleshootingProduct(id);
        if (result?.error) {
            alert(result.error);
        }
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Box size={18} className="text-blue-600" />
                    Machines / Products
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium transition flex items-center gap-1"
                >
                    <Plus size={14} /> New Machine
                </button>
            </div>

            {isAdding && (
                <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
                    <form ref={formRef} action={handleAdd} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Model Name</label>
                            <input name="name" className="w-full mt-1 p-2 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CAT D11 R" required />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-slate-500 uppercase">Seq</label>
                            <input type="number" name="viewSeq" className="w-full mt-1 p-2 border border-blue-200 rounded text-sm" defaultValue={99} />
                        </div>
                        <FormSubmitButton className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium">
                            Save
                        </FormSubmitButton>
                    </form>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 w-20">Seq</th>
                                <th className="px-4 py-3">Machine Name</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <SortableContext
                                items={localProducts.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {localProducts.map((p) => (
                                    <SortableProductRow
                                        key={p.id}
                                        p={p}
                                        editingId={editingId}
                                        editSeq={editSeq}
                                        editName={editName}
                                        setEditSeq={setEditSeq}
                                        setEditName={setEditName}
                                        handleUpdate={handleUpdate}
                                        setEditingId={setEditingId}
                                        startEdit={startEdit}
                                        deleteProduct={handleDelete}
                                        toggleStatus={toggleStatus}
                                    />
                                ))}
                            </SortableContext>
                            {localProducts.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No machines found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DndContext>
        </div>
    );
}
