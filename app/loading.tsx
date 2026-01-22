import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md">
            <div className="animate-breathe flex flex-col items-center gap-0">
                <div className="relative w-72 h-32">
                    <Image
                        src="/thriveny_logo.svg"
                        alt="Thriveni"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="relative w-85 h-34">
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
    );
}
