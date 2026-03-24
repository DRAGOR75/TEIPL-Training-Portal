import React from 'react';

export default function FormatList({ text, label, className = '' }: { text?: string | null; label?: string; className?: string }) {
    if (!text) return null;
    let items = [text];
    
    // Check if text has "1.", "2.", etc. and split it
    if (/\d+\./.test(text)) {
        items = text.split(/\s*(?=\d+\.)/).map(item => item.trim()).filter(i => i.length > 2);
    }

    if (items.length > 1) {
        return (
            <div className={className}>
                {label && <span className="font-bold">{label}: </span>}
                <ul className="list-disc pl-4 space-y-1 mt-1">
                    {items.map((item, idx) => (
                        <li key={idx} className="block">{item}</li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className={className}>
            {label && <span className="font-bold">{label}: </span>}
            {text}
        </div>
    );
}
