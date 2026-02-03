import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitManagerNominationDecision } from './manager-approval';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock Modules
vi.mock('@/lib/prisma', () => ({
    db: {
        nomination: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
    },
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

        const result = await submitManagerNominationDecision(nominationId, 'Approved');

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

        const reason = 'Not relevant now';
        const result = await submitManagerNominationDecision(nominationId, 'Rejected', reason);

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

        const result = await submitManagerNominationDecision(nominationId, 'Approved');

        expect(result).toEqual({ success: false, error: 'Failed to submit decision' });
    });
});
