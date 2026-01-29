'use client';

import { useState } from 'react';
import { Layers, AlertTriangle, Stethoscope, Workflow, UploadCloud } from 'lucide-react';
import ProductManager from './ProductManager';
import FaultManager from './FaultManager';
import CauseManager from './CauseManager';
import DiagnosticSequencer from './DiagnosticSequencer';
import BulkUploader from './BulkUploader';

// Types for the props (using any for now to match the implicit types, or ideally import from prisma)
interface AdminTabsProps {
    products: any[];
    faultLib: any[];
    causeLib: any[];
}

export default function AdminTabs({ products, faultLib, causeLib }: AdminTabsProps) {
    const [activeTab, setActiveTab] = useState('sequencer');

    const tabs = [
        { id: 'sequencer', label: 'Cause Manager', icon: Workflow },
        { id: 'products', label: 'Machine Manager', icon: Layers },
        { id: 'faults', label: 'Fault Manager', icon: AlertTriangle },
        { id: 'causes', label: 'Cause Library', icon: Stethoscope },
        { id: 'import', label: 'Bulk Import', icon: UploadCloud },
    ];

    return (
        <div>
            <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit overflow-x-auto max-w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in zoom-in-95 duration-200">
                {activeTab === 'sequencer' && (
                    <DiagnosticSequencer
                        products={products}
                        allFaults={faultLib}
                        allCauses={causeLib}
                    />
                )}
                {activeTab === 'products' && (
                    <div className="max-w-4xl">
                        <ProductManager products={products} />
                    </div>
                )}
                {activeTab === 'faults' && (
                    <div className="max-w-4xl">
                        <FaultManager faults={faultLib} products={products} />
                    </div>
                )}
                {activeTab === 'causes' && (
                    <div className="max-w-6xl">
                        <CauseManager causes={causeLib} />
                    </div>
                )}
                {activeTab === 'import' && (
                    <BulkUploader />
                )}
            </div>
        </div>
    );
}
