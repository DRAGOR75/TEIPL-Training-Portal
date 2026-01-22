import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md">
            <div className="relative flex items-center justify-center w-80 h-32">
                {/* Logo 1: Thriveni - Visible First */}
                <div className="absolute inset-0 flex items-center justify-center animate-cycle-1">
                    <div className="relative w-64 h-24">
                        <Image
                            src="/thriveny_logo.svg"
                            alt="Thriveni"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Logo 2: Lloyds - Visible Second */}
                <div className="absolute inset-0 flex items-center justify-center animate-cycle-2">
                    <div className="relative w-70 h-28">
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
        </div>
    );
}
