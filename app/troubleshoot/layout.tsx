import TroubleshootNavbar from '@/components/troubleshoot/TroubleshootNavbar';
import TroubleshootFooter from '@/components/troubleshoot/TroubleshootFooter';

export default function TroubleshootingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <TroubleshootNavbar />
            <main className="flex-1 w-full max-w-[95%] mx-auto px-4 md:px-8 py-6 md:py-10">
                {children}
            </main>
            <TroubleshootFooter />
        </div>
    );
}
