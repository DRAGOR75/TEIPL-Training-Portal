"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import SearchableSelect from '@/components/ui/SearchableSelect';

type Employee = {
    id: string;
    name: string;
    email: string;
    mobile: string | null;
};

export default function EmployeeSearch({ employees, basePath }: { employees: Employee[], basePath: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentEmpId = searchParams.get('empId') || '';

    const options = employees.map(emp => ({
        value: emp.id,
        label: `${emp.name} (ID: ${emp.id}) ${emp.email ? `- ${emp.email}` : ''} ${emp.mobile ? `- ${emp.mobile}` : ''}`
    }));

    const handleSelect = (val: string) => {
        if (val) {
            router.push(`${basePath}?empId=${encodeURIComponent(val)}`);
        } else {
            router.push(`${basePath}`);
        }
    };

    const handleAddNew = (query: string) => {
        if (query.trim()) {
            router.push(`${basePath}?empId=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-4">
                Employee TNI Search
            </h2>
            <div className="w-full">
                <SearchableSelect
                    options={options}
                    value={currentEmpId}
                    onChange={handleSelect}
                    placeholder="Search by Name, Employee ID, Email, or Mobile..."
                    searchPlaceholder="Type to search employees..."
                    noResultsText="No employees found."
                    icon={<HiOutlineMagnifyingGlass size={20} />}
                    onAddNew={handleAddNew}
                    addNewLabel="Add New Employee with ID"
                    className="w-full"
                />
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">
                * Note: To add a new employee, type their new Employee ID in the search box and select "Add New Employee".
            </p>
        </div>
    );
}
