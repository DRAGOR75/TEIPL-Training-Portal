import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md">
            <div className="animate-breathe relative w-80 h-24">
                <Image
                    src="/thriveny_logo.svg"
                    alt="Thriveni"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        </div>
    );
}
