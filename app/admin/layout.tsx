export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto w-full relative">
                {children}
            </div>
        </div>
    );
}
