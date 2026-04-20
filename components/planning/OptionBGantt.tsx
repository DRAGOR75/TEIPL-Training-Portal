'use client';

import { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface Program {
    id: string;
    name: string;
}

interface Session {
    id: string;
    programName: string;
    trainerName: string | null;
    startDate: Date;
    endDate: Date;
}

interface OptionBGanttProps {
    sessions: Session[];
    trainers: any[];
}

export default function OptionBGantt({ sessions, trainers }: OptionBGanttProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

    // Build the tasks array required by gantt-task-react
    let tasks: Task[] = [];
    
    // First, add Trainers as "Project" headers (group rows)
    const activeTrainers = [...trainers, { id: 'unassigned', name: 'Unassigned' }];
    
    activeTrainers.forEach(trainer => {
        // Create an invisible milestone or group-level project wrapper for the trainer name
        tasks.push({
            id: trainer.id,
            type: 'project',
            name: trainer.name,
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            progress: 100,
            hideChildren: false
        });

        // Add sessions as child tasks
        const tSessions = sessions.filter(s => 
            (trainer.name === 'Unassigned' && (!s.trainerName || s.trainerName === 'Unassigned')) || 
            (s.trainerName === trainer.name)
        );

        tSessions.forEach(session => {
            tasks.push({
                id: session.id,
                type: 'task',
                name: session.programName,
                start: new Date(session.startDate),
                end: new Date(session.endDate),
                progress: 100, // Visual only
                project: trainer.id,
                styles: {
                    progressColor: '#4f46e5',
                    progressSelectedColor: '#312e81',
                }
            });
        });
    });

    // Fallback if completely empty
    if (tasks.length === 0) {
        tasks = [{
            id: 'placeholder',
            type: 'task',
            name: 'No Sessions',
            start: new Date(),
            end: new Date(),
            progress: 0,
        }];
    }

    return (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 flex flex-col gap-6 h-[800px]">
            <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                <div>
                   <h2 className="text-xl font-black text-slate-800">Library: gantt-task-react</h2>
                   <p className="text-sm font-medium text-slate-500">This is Option B working!</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode(ViewMode.Day)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === ViewMode.Day ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        Day
                    </button>
                    <button 
                        onClick={() => setViewMode(ViewMode.Week)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === ViewMode.Week ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        Week
                    </button>
                    <button 
                        onClick={() => setViewMode(ViewMode.Month)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === ViewMode.Month ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        Month
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden border border-slate-200 rounded-xl relative">
               {/* library wrapper limits width inside its container beautifully */}
               <Gantt 
                    tasks={tasks}
                    viewMode={viewMode}
                    listCellWidth="155px"
                    columnWidth={viewMode === ViewMode.Month ? 65 : 60}
               />
            </div>
        </div>
    );
}
