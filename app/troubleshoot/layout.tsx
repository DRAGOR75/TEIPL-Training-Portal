import TroubleshootNavbar from '@/components/troubleshoot/TroubleshootNavbar';

export default function TroubleshootingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100">
            <TroubleshootNavbar />
            <main className="w-full max-w-[95%] mx-auto px-4 md:px-8 py-6 md:py-10">
                {children}
            </main>
        </div>
    );
}
