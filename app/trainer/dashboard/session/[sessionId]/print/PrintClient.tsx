'use client';

import { useEffect } from 'react';

export default function PrintClient() {
    useEffect(() => {
        // Short timeout to ensure styles and fonts are loaded before triggering print
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
