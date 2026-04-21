'use client';

import { useState } from 'react';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface TNIProgramSelectProps {
    programs: any[];
    category: string;
    name: string;
    placeholder?: string;
}

export default function TNIProgramSelect({ programs, category, name, placeholder }: TNIProgramSelectProps) {
    const [value, setValue] = useState<string>('');
    const options = programs
        .filter(p => p.category === category)
        .map(p => ({ label: p.name, value: p.id }));

    return (
        <SearchableSelect 
            name={name}
            options={options}
            value={value}
            onChange={(val) => setValue(val)}
            placeholder={placeholder || `-- Select ${category} Program --`}
            searchPlaceholder="Type to search programs..."
            className="w-full"
        />
    );
}
