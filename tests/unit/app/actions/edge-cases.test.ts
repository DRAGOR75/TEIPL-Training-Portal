import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitTNINomination } from '@/app/actions/tni';
import { db } from '@/lib/prisma';
import { sendTNIApprovalEmail } from '@/lib/email';
import { redirect } from 'next/navigation';

// Mock Modules
vi.mock('@/lib/prisma', () => ({
    db: {
        nomination: {
            createMany: vi.fn(),
            findFirst: vi.fn() // Add findFirst to check duplicates if implemented, or we assume DB constraint
        },
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

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

describe('Edge Cases: TNI Nomination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const empId = 'emp-edge-001';
    const programId = 'prog-edge-001';

    it('should handle Database Constraints (e.g. Unique Constraints) gracefully', async () => {
        const formData = new FormData();
        formData.append('empId', empId);
        formData.append('programId_FOUNDATIONAL', programId);
        formData.append('justification', 'Duplicate attempt');

        // Simulate Prisma Constraint Violation Error (P2002)
        const prismaError = new Error('Unique constraint failed on the fields: (`empId`,`programId`)');
        (prismaError as any).code = 'P2002';

        (db.nomination.createMany as any).mockRejectedValue(prismaError);

        // We expect the function to catch the error and throw a user-friendly message
        // OR if the current implementation just throws "Failed to submit", we verify that.
        // Current implementation: throws "Failed to submit nominations"

        await expect(submitTNINomination(formData)).rejects.toThrow('Failed to submit nominations');
    });

    it('should not send email if database insertion fails', async () => {
        const formData = new FormData();
        formData.append('empId', empId);
        formData.append('programId_FOUNDATIONAL', programId);

        (db.nomination.createMany as any).mockRejectedValue(new Error('DB Connection Lost'));

        try {
            await submitTNINomination(formData);
        } catch (e) {
            // Error expected
        }

        // Critical Check: Email should NOT be sent
        expect(sendTNIApprovalEmail).not.toHaveBeenCalled();
    });
});
