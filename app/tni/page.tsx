import { checkEmployeeAccess } from '@/app/actions/tni';

export default function TNILoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md shadow-lg bg-white rounded-lg border border-slate-200">
                <div className="p-6 text-center border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">TNI Portal</h2>
                    <p className="text-slate-500 mt-1">Enter your Employee ID to proceed with nominations</p>
                </div>
                <div className="p-6">
                    <form action={checkEmployeeAccess} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="empId" className="block text-sm font-medium text-slate-700">
                                Employee ID
                            </label>
                            <input
                                id="empId"
                                name="empId"
                                placeholder="e.g. 10456"
                                required
                                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 text-lg"
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-md transition-colors">
                            Continue
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
