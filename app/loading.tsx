import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl">
            <div className="relative flex items-center justify-center w-80 h-40">

                {/* Logo 1: Thriveni */}
                <div className="absolute inset-0 flex items-center justify-center animate-blur-cycle-1">
                    <div className="relative w-64 h-24 transition-all duration-700">
                        <Image
                            src="/thriveny_logo.svg"
                            alt="Thriveni"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Logo 2: Lloyds */}
                <div className="absolute inset-0 flex items-center justify-center animate-blur-cycle-2">
                    <div className="relative w-64 h-24 transition-all duration-700">
                        <Image
                            src="/LLoyds_logo.svg"
                            alt="Lloyds"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* Optional: Subtle Progress Bar */}
            <div className="mt-8 w-48 h-[2px] bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400/50 animate-shimmer origin-left w-full" />
            </div>
        </div>
    );
}
