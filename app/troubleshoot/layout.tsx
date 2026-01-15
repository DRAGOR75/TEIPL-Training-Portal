import TroubleshootNavbar from '@/components/troubleshoot/TroubleshootNavbar';

export default function TroubleshootingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <TroubleshootNavbar />
            <main className="container mx-auto px-4 md:px-8 max-w-7xl py-6 md:py-10">
                {children}
            </main>
        </div>
    );
}
