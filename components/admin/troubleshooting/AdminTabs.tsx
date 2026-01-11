'use client';

import { useState } from 'react';
import { Layers, AlertTriangle, Stethoscope, Workflow } from 'lucide-react';
import ProductManager from './ProductManager';
import FaultManager from './FaultManager';
import CauseManager from './CauseManager';
import DiagnosticSequencer from './DiagnosticSequencer';

// Types for the props (using any for now to match the implicit types, or ideally import from prisma)
interface AdminTabsProps {
    products: any[];
    faultLib: any[];
    causeLib: any[];
}

export default function AdminTabs({ products, faultLib, causeLib }: AdminTabsProps) {
    const [activeTab, setActiveTab] = useState('sequencer');

    const tabs = [
        { id: 'sequencer', label: 'Diagnostic Sequencer', icon: Workflow },
        { id: 'products', label: 'Machine Manager', icon: Layers },
        { id: 'faults', label: 'Fault Library', icon: AlertTriangle },
        { id: 'causes', label: 'Cause Library', icon: Stethoscope },
    ];

    return (
        <div>
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={16} />
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
                        <FaultManager faults={faultLib} />
                    </div>
                )}
                {activeTab === 'causes' && (
                    <div className="max-w-6xl">
                        <CauseManager causes={causeLib} />
                    </div>
                )}
            </div>
        </div>
    );
}
