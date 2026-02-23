import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitManagerNominationDecision } from '@/app/actions/manager-approval';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as security from '@/lib/security';

// Mock Modules
vi.mock('@/lib/prisma', () => ({
    db: {
        nomination: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/security', () => ({
    verifySecureToken: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('submitManagerNominationDecision', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const nominationId = 'nom-123';
    const empId = 'emp-456';

    it('should successfully APPROVE a nomination', async () => {
        (db.nomination.findUnique as any).mockResolvedValue({ status: 'Pending', empId });
        (db.nomination.update as any).mockResolvedValue({});
        (security.verifySecureToken as any).mockReturnValue(true);

        const result = await submitManagerNominationDecision(nominationId, 'Approved', 'dummy-token');

        expect(result).toEqual({ success: true });

        // Verify Update
        expect(db.nomination.update).toHaveBeenCalledWith({
            where: { id: nominationId },
            data: {
                managerApprovalStatus: 'Approved',
                managerRejectionReason: null,
                status: 'Approved' // Sync logic
            }
        });

        // Verify Revalidate
        expect(revalidatePath).toHaveBeenCalledWith('/admin/sessions');
        expect(revalidatePath).toHaveBeenCalledWith(`/tni/${empId}`);
    });

    it('should successfully REJECT a nomination and reset status', async () => {
        (db.nomination.findUnique as any).mockResolvedValue({ status: 'Batched', empId });
        (db.nomination.update as any).mockResolvedValue({});
        (security.verifySecureToken as any).mockReturnValue(true);

        const reason = 'Not relevant now';
        const result = await submitManagerNominationDecision(nominationId, 'Rejected', 'dummy-token', reason);

        expect(result).toEqual({ success: true });

        // Verify Update - Check for Reset Logic
        expect(db.nomination.update).toHaveBeenCalledWith({
            where: { id: nominationId },
            data: {
                managerApprovalStatus: 'Rejected',
                managerRejectionReason: reason,
                status: 'Pending', // Should reset to Pending
                batchId: null,     // Should clear batch
            }
        });
    });

    it('should handle DB errors', async () => {
        (db.nomination.update as any).mockRejectedValue(new Error('DB Error'));
        (security.verifySecureToken as any).mockReturnValue(true);

        const result = await submitManagerNominationDecision(nominationId, 'Approved', 'dummy-token');

        expect(result).toEqual({ success: false, error: 'Failed to submit decision' });
    });
});
