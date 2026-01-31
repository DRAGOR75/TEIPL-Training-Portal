import { redirect } from 'next/navigation';
import { HiOutlineArrowRight, HiOutlineUser, HiOutlineInformationCircle } from 'react-icons/hi2';
import { BiTargetLock } from 'react-icons/bi';
import { FormSubmitButton } from '@/components/FormSubmitButton';


export default function TNILoginPage() {

    async function handleLogin(formData: FormData) {
        'use server';
        const empId = formData.get('empId') as string;
        if (empId) {
            redirect(`/tni/${empId}`);
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-slate-900 to-slate-900"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                            <BiTargetLock className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Training Portal</h1>
                        <p className="text-slate-400 text-sm">Identify your needs, upgrade your skills.</p>
                    </div>
                </div>

                <div className="p-8 pt-10">
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start">
                        <HiOutlineInformationCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-red-700 space-y-2">
                            <p className="font-bold border-b border-red-200 pb-1 mb-2">Note: Before entering with your Employee ID</p>
                            <ul className="list-disc pl-4 space-y-1.5 opacity-90">
                                <li>This TNI Process should be initiated in discussion with your manager.</li>
                                <li>Once you submit the training need, your manager will receive a mail for approval.</li>
                                <li>The employee should ensure they get approval from the manager.</li>
                            </ul>
                        </div>
                    </div>

                    <form action={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="empId" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Employee ID
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <HiOutlineUser size={20} />
                                </div>
                                <input
                                    name="empId"
                                    id="empId"
                                    required
                                    placeholder="Enter your Employee ID"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium bg-slate-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        <FormSubmitButton className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20">
                            <span>Continue</span>
                            <HiOutlineArrowRight size={20} />
                        </FormSubmitButton>
                    </form>
                </div>

                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Internal System • Authorized Personnel Only</p>
                </div>
            </div>
        </div>
    );
}
