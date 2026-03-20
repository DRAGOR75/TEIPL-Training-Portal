'use client';

import { HiOutlineCheckCircle, HiOutlineMagnifyingGlass, HiOutlineWrench } from 'react-icons/hi2';

export default function TroubleshootFooter() {
    return (
        <footer className="w-full bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] rounded-t-[0.5rem] mt-auto">
            <div className="w-full px-4 py-8 md:py-10">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="flex items-center justify-center gap-3 text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                            <HiOutlineCheckCircle size={14} className="text-emerald-500 hover:scale-110 transition-transform" />
                            Identify
                        </span>
                        <span className="w-px h-3 bg-slate-300"></span>
                        <span className="flex items-center gap-1.5">
                            <HiOutlineMagnifyingGlass size={14} className="text-sky-500 hover:scale-110 transition-transform" />
                            Diagnose
                        </span>
                        <span className="w-px h-3 bg-slate-300"></span>
                        <span className="flex items-center gap-1.5">
                            <HiOutlineWrench size={14} className="text-amber-500 hover:scale-110 transition-transform" />
                            Resolve
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-[0.3em] hover:text-slate-400 transition-colors cursor-default">
                            Training Department
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
