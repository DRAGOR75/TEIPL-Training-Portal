import BulkUploadSessionsClient from '@/components/admin/BulkUploadSessionsClient';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export const metadata = {
    title: 'Bulk Upload Sessions | Admin',
};

export default function BulkUploadSessionsPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-8 shadow-sm relative z-10">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="flex flex-col space-y-4">
                        <Link href="/admin/sessions" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1 group w-fit">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Sessions
                        </Link>

                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
                                Bulk Upload <span className="text-indigo-600">Sessions</span>
                            </h1>
                            <p className="text-slate-500 font-medium">
                                Create multiple training sessions simultaneously by uploading a CSV file.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-6 pt-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BulkUploadSessionsClient />
            </div>
        </div>
    );
}
