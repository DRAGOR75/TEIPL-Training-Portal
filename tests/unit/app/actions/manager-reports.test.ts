import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchEmployeesToAdd } from '@/app/actions/manager-reports';
import { db } from '@/lib/prisma';
import { auth } from '@/auth';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    db: {
        employee: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            groupBy: vi.fn(),
        },
    },
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('searchEmployeesToAdd', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns empty array when query is less than 2 characters', async () => {
        (auth as any).mockResolvedValue({ user: { email: 'admin@company.com' } });
        const res = await searchEmployeesToAdd('a', 'manager@company.com');
        expect(res.candidates).toEqual([]);
        expect(db.employee.findMany).not.toHaveBeenCalled();
    });

        it('returns unassigned employees, employees under other managers, and filters out the current manager team', async () => {
            (auth as any).mockResolvedValue({ user: { email: 'admin@company.com' } });
            (db.employee.findMany as any).mockResolvedValue([
                {
                    id: 'EMP001',
                    name: 'John Doe',
                    email: 'john@company.com',
                    department: 'Engineering',
                    sectionName: 'Mining',
                    designation: 'Tech',
                    location: 'Site A',
                    managerName: null,
                    managerEmail: null, // Unassigned
                },
                {
                    id: 'EMP002',
                    name: 'Jane Smith',
                    email: 'jane@company.com',
                    department: 'Engineering',
                    sectionName: 'Mining',
                    designation: 'Lead',
                    location: 'Site A',
                    managerName: 'Other Manager',
                    managerEmail: 'other@company.com', // Other manager
                },
                {
                    id: 'EMP003',
                    name: 'Already On Team',
                    email: 'team@company.com',
                    department: 'Engineering',
                    sectionName: 'Mining',
                    designation: 'Staff',
                    location: 'Site A',
                    managerName: 'Target Manager',
                    managerEmail: 'targetmanager@company.com', // Current manager (should be excluded)
                },
                {
                    id: 'EMP004',
                    name: 'NA Manager Employee',
                    email: 'na@company.com',
                    department: 'Operations',
                    sectionName: 'Safety',
                    designation: 'Operator',
                    location: 'Site B',
                    managerName: 'N/A',
                    managerEmail: 'N/A', // String N/A -> unassigned
                }
            ]);

            const res = await searchEmployeesToAdd('Jo', 'targetmanager@company.com');

            // Target manager employee (EMP003) must be excluded
            expect(res.candidates.length).toBe(3);

            // EMP001 (null manager) is present and marked unassigned
            expect(res.candidates[0].id).toBe('EMP001');
            expect(res.candidates[0].currentManagerEmail).toBeUndefined();

            // EMP002 (other manager) is present and retains manager email
            expect(res.candidates[1].id).toBe('EMP002');
            expect(res.candidates[1].currentManagerEmail).toBe('other@company.com');

            // EMP004 ('N/A' manager) is present and marked unassigned
            expect(res.candidates[2].id).toBe('EMP004');
            expect(res.candidates[2].currentManagerEmail).toBeUndefined();
        });

            it('does not filter out anyone when excludeManagerEmail is empty or undefined', async () => {
                (auth as any).mockResolvedValue({ user: { email: 'admin@company.com' } });
                (db.employee.findMany as any).mockResolvedValue([
                    {
                        id: 'EMP001',
                        name: 'John Doe',
                        email: 'john@company.com',
                        department: 'Engineering',
                        sectionName: 'Mining',
                        designation: 'Tech',
                        location: 'Site A',
                        managerName: null,
                        managerEmail: null,
                    }
                ]);

                const res = await searchEmployeesToAdd('John', '');
                expect(res.candidates.length).toBe(1);
                expect(res.candidates[0].id).toBe('EMP001');
            });
        });
