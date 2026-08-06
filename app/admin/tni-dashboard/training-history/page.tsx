import { Metadata } from 'next';
import TrainingHistoryClient from './TrainingHistoryClient';

export const metadata: Metadata = {
    title: 'Training History | Admin',
    description: 'Manage training history records',
};

export default function TrainingHistoryPage() {
    return (

        <TrainingHistoryClient />

    );
}
