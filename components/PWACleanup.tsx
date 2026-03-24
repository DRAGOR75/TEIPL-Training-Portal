'use client';

import { useEffect } from 'react';

export default function PWACleanup({ hostname = '' }: { hostname?: string }) {
    useEffect(() => {
        const isTroubleshootHost = hostname.toLowerCase().startsWith('troubleshoot') || 
                                 hostname.toLowerCase().includes('hemmts');
        
        // If we are NOT on the troubleshoot host, actively unregister any service workers
        // to prevent the Training Portal from mistakenly showing an "Install App" prompt.
        if (!isTroubleshootHost && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    console.log('Unregistering SW on Portal to prevent PWA prompt:', registration.scope);
                    registration.unregister();
                }
            });
        }
    }, [hostname]);

    return null;
}
