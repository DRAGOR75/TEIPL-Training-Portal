import Link from 'next/link';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

export default function ManagerSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-indigo-100">

                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineShieldCheck size={32} strokeWidth={2.5} />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">Review Completed</h1>
                <p className="text-slate-600 mb-8">
                    You have successfully validated the training effectiveness for this employee.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500 mb-6">
                    Thankyou for Your Valuable time.
                </div>


            </div>
        </div>
    );
}