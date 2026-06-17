import { HiOutlineArrowPath } from 'react-icons/hi2';

export default function MasterDataLoading() {
    return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4 animate-in fade-in duration-300">
            <HiOutlineArrowPath className="w-8 h-8 text-slate-300 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Loading Data...
            </p>
        </div>
    );
}
