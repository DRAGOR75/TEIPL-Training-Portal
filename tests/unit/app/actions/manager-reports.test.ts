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

    it('explicitly includes unassigned employees (managerEmail is null) in where clause', async () => {
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
                managerEmail: 'other@company.com',
            }
        ]);

        const res = await searchEmployeesToAdd('Jo', 'targetmanager@company.com');

        // Check where clause contains explicit handling for managerEmail: null
        expect(db.employee.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    AND: [
                        {
                            OR: [
                                { managerEmail: null },
                                { managerEmail: { not: { equals: 'targetmanager@company.com', mode: 'insensitive' } } }
                            ]
                        }
                    ]
                })
            })
        );

        expect(res.candidates.length).toBe(2);
        // EMP001 has no manager -> should be marked as unassigned
        expect(res.candidates[0].currentManagerEmail).toBeUndefined();
        // EMP002 has other manager -> should retain other manager's email
        expect(res.candidates[1].currentManagerEmail).toBe('other@company.com');
    });

    it('does not filter by managerEmail when excludeManagerEmail is empty', async () => {
        (auth as any).mockResolvedValue({ user: { email: 'admin@company.com' } });
        (db.employee.findMany as any).mockResolvedValue([]);

        await searchEmployeesToAdd('John', '');

        expect(db.employee.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    OR: [
                        { name: { contains: 'John', mode: 'insensitive' } },
                        { id: { contains: 'John', mode: 'insensitive' } },
                        { email: { contains: 'John', mode: 'insensitive' } }
                    ]
                }
            })
        );
    });
});

