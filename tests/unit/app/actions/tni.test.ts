import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitTNINomination } from '@/app/actions/tni';
import { db } from '@/lib/prisma';
import { sendTNIApprovalEmail } from '@/lib/email';
import { redirect } from 'next/navigation';

// Mock Modules
vi.mock('@/lib/prisma', () => ({
    db: {
        nomination: { createMany: vi.fn() },
        employee: { findUnique: vi.fn() },
        program: { findMany: vi.fn() },
    },
}));

vi.mock('@/lib/email', () => ({
    sendTNIApprovalEmail: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: (fn: any) => fn,
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

describe('submitTNINomination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const empId = 'emp-123';
    const programId = 'prog-456';
    const justification = 'Recommended for leadership role';

    it('should throw error if Employee ID is missing', async () => {
        const formData = new FormData();
        formData.append('programId_FOUNDATIONAL', programId);

        await expect(submitTNINomination(formData)).rejects.toThrow('Employee ID (max 50) and at least one Program are required');
    });

    it('should throw error if no Program is selected', async () => {
        const formData = new FormData();
        formData.append('empId', empId);

        await expect(submitTNINomination(formData)).rejects.toThrow('Employee ID (max 50) and at least one Program are required');
    });

    it('should successfully submit nomination and send email', async () => {
        const formData = new FormData();
        formData.append('empId', empId);
        formData.append('justification', justification);
        formData.append('programId_FOUNDATIONAL', programId);

        // Mock DB responses
        (db.nomination.createMany as any).mockResolvedValue({ count: 1 });

        (db.employee.findUnique as any).mockResolvedValue({
            name: 'John Doe',
            managerEmail: 'manager@example.com',
            managerName: 'Jane Manager',
        });

        (db.program.findMany as any).mockResolvedValue([
            { name: 'Leadership 101' }
        ]);

        // Mock Email response
        (sendTNIApprovalEmail as any).mockResolvedValue({ success: true });

        // Execute
        await submitTNINomination(formData);

        // Verify DB Create
        expect(db.nomination.createMany).toHaveBeenCalledWith({
            data: [{
                empId,
                programId,
                justification,
                status: 'Pending',
            }]
        });

        // Verify Email sent
        expect(sendTNIApprovalEmail).toHaveBeenCalledWith(
            'manager@example.com',
            'Jane Manager',
            'John Doe',
            ['Leadership 101'],
            justification,
            empId
        );

        // Verify Redirect
        expect(redirect).toHaveBeenCalledWith(`/tni/${empId}`);
    });

    it('should skip email if manager email is missing', async () => {
        const formData = new FormData();
        formData.append('empId', empId);
        formData.append('programId_FOUNDATIONAL', programId);

        (db.nomination.createMany as any).mockResolvedValue({ count: 1 });

        // Mock Employee WITHOUT manager email
        (db.employee.findUnique as any).mockResolvedValue({
            name: 'John Doe',
            managerEmail: null,
        });

        await submitTNINomination(formData);

        // Verify Email NOT sent
        expect(sendTNIApprovalEmail).not.toHaveBeenCalled();

        // Still redirects
        expect(redirect).toHaveBeenCalledWith(`/tni/${empId}`);
    });
});
