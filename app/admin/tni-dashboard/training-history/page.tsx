import { Metadata } from 'next';
import TrainingHistoryClient from './TrainingHistoryClient';

export const metadata: Metadata = {
    title: 'Training History | Admin',
    description: 'Manage training history records',
};

export default function TrainingHistoryPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Training History</h1>
                <p className="text-slate-600 mt-1">View, filter and manage training session records</p>
            </div>
            
            <TrainingHistoryClient />
        </div>
    );
}
