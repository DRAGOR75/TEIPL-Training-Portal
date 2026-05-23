import { HiOutlineBookOpen, HiOutlineArrowUpTray, HiOutlineArrowPath, HiOutlinePlus } from 'react-icons/hi2';

export default function BulkUploadManager() {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 flex justify-between items-center border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                        <HiOutlineArrowUpTray size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Bulk Upload Center</h3>
                        <p className="text-xs text-slate-500 font-medium">Manage all your CSV imports here</p>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Program Bulk Upload Card */}
                    <div className="border border-slate-200 rounded-3xl p-8 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <HiOutlineBookOpen size={28} />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3 tracking-tight">Program Upload</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                            Upload a CSV file containing multiple program definitions including categories, target grades, and sections.
                        </p>
                        <label className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm cursor-pointer transition-colors border border-emerald-200 shadow-sm">
                            <HiOutlineArrowUpTray size={18} className="stroke-[2.5]" /> Select CSV File
                            <input type="file" className="hidden" accept=".csv" />
                        </label>
                    </div>

                    {/* Legacy Bulk Upload Card */}
                    <div className="border border-slate-200 rounded-3xl p-8 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <HiOutlineArrowPath size={28} />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3 tracking-tight">Legacy Upload</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                            Import historical training records and past participation data to maintain legacy compliance.
                        </p>
                        <label className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-sm cursor-pointer transition-colors border border-amber-200 shadow-sm">
                            <HiOutlineArrowUpTray size={18} className="stroke-[2.5]" /> Select CSV File
                            <input type="file" className="hidden" accept=".csv" />
                        </label>
                    </div>

                    {/* TNI Bulk Upload Card */}
                    <div className="border border-slate-200 rounded-3xl p-8 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <HiOutlinePlus size={28} className="stroke-[2.5]" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-3 tracking-tight">TNI Nominations</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                            Bulk nominate employees for training programs using the standard TNI upload format.
                        </p>
                        <label className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-sm cursor-pointer transition-colors border border-blue-200 shadow-sm">
                            <HiOutlineArrowUpTray size={18} className="stroke-[2.5]" /> Select CSV File
                            <input type="file" className="hidden" accept=".csv" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
