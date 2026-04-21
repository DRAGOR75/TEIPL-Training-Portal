'use client';

import { useState } from 'react';
import {
    HiOutlineBookOpen,
    HiOutlineRectangleGroup,
    HiOutlineDocumentText,
    HiOutlineLink
} from 'react-icons/hi2';
import SubjectSpreadsheet from './SubjectSpreadsheet';
import ModuleSpreadsheet from './ModuleSpreadsheet';
import TopicSpreadsheet from './TopicSpreadsheet';
import ManualLinker from './ManualLinker';

interface ManualAdminTabsProps {
    subjects: any[];
    moduleLib: any[];
    topicLib: any[];
}

export default function ManualAdminTabs({ subjects, moduleLib, topicLib }: ManualAdminTabsProps) {
    const [activeTab, setActiveTab] = useState('subjects');

    const tabs = [
        { id: 'subjects', label: 'Subjects', icon: HiOutlineBookOpen, count: subjects.length },
        { id: 'modules', label: 'Modules', icon: HiOutlineRectangleGroup, count: moduleLib.length },
        { id: 'topics', label: 'Topics', icon: HiOutlineDocumentText, count: topicLib.length },
        { id: 'linker', label: 'Linker', icon: HiOutlineLink },
    ];

    return (
        <div>
            <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit overflow-x-auto max-w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in zoom-in-95 duration-200">
                {activeTab === 'subjects' && (
                    <SubjectSpreadsheet subjects={subjects} />
                )}
                {activeTab === 'modules' && (
                    <ModuleSpreadsheet modules={moduleLib} />
                )}
                {activeTab === 'topics' && (
                    <TopicSpreadsheet topics={topicLib} />
                )}
                {activeTab === 'linker' && (
                    <ManualLinker subjects={subjects} moduleLib={moduleLib} topicLib={topicLib} />
                )}
            </div>
        </div>
    );
}
