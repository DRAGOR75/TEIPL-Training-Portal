import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitEmployeeFeedback, submitManagerReview } from '@/app/actions';
import { db } from '@/lib/prisma';
import { verifySecureToken } from '@/lib/security';
import { sendFeedbackReviewRequestEmail } from '@/lib/email';

// Mock Dependencies
vi.mock('@/lib/prisma', () => ({
    db: {
        enrollment: {
            update: vi.fn(),
        },
    },
}));

vi.mock('@/lib/security', () => ({
    verifySecureToken: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendFeedbackReviewRequestEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Feedback Action Security (Vulnerability T25)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('submitEmployeeFeedback', () => {
        it('should REJECT submission with missing token', async () => {
            const formData = new FormData();
            formData.append('enrollmentId', 'enr-123');

            const result = await submitEmployeeFeedback(formData);

            expect(result).toEqual({ success: false, error: "Unauthorized: Invalid or missing security token." });
            expect(db.enrollment.update).not.toHaveBeenCalled();
        });

        it('should REJECT submission with invalid token', async () => {
            (verifySecureToken as any).mockReturnValue(false);

            const formData = new FormData();
            formData.append('enrollmentId', 'enr-123');
            formData.append('token', 'invalid-token');

            const result = await submitEmployeeFeedback(formData);

            expect(result).toEqual({ success: false, error: "Unauthorized: Invalid or missing security token." });
            expect(verifySecureToken).toHaveBeenCalledWith('invalid-token', 'enr-123');
            expect(db.enrollment.update).not.toHaveBeenCalled();
        });

        it('should ACCEPT submission with valid token', async () => {
            (verifySecureToken as any).mockReturnValue(true);
            (db.enrollment.update as any).mockResolvedValue({
                managerEmail: 'manager@test.com',
                managerName: 'Manager',
                employeeName: 'Employee',
                session: { programName: 'Program' }
            });

            const formData = new FormData();
            formData.append('enrollmentId', 'enr-123');
            formData.append('token', 'valid-token');
            formData.append('q1', '5');
            formData.append('q2', '5');
            formData.append('q3', '5');
            formData.append('q4', '5');
            formData.append('q5', '5');

            const result = await submitEmployeeFeedback(formData);

            expect(result).toEqual({ success: true });
            expect(db.enrollment.update).toHaveBeenCalled();
            expect(sendFeedbackReviewRequestEmail).toHaveBeenCalled();
        });
    });

    describe('submitManagerReview', () => {
        it('should REJECT submission with missing token', async () => {
            const formData = new FormData();
            formData.append('enrollmentId', 'enr-123');

            const result = await submitManagerReview(formData);

            expect(result).toEqual({ success: false, error: "Unauthorized: Invalid or missing security token." });
            expect(db.enrollment.update).not.toHaveBeenCalled();
        });

        it('should ACCEPT submission with valid token', async () => {
            (verifySecureToken as any).mockReturnValue(true);
            (db.enrollment.update as any).mockResolvedValue({
                managerName: 'Manager',
                managerEmail: 'manager@test.com',
                employeeName: 'Employee',
                session: { programName: 'Program', trainerName: null }
            });

            const formData = new FormData();
            formData.append('enrollmentId', 'enr-123');
            formData.append('token', 'valid-token');
            formData.append('agree', 'Yes');
            formData.append('comments', 'Good job');

            const result = await submitManagerReview(formData);

            expect(result).toEqual({ success: true });
            expect(db.enrollment.update).toHaveBeenCalled();
        });
    });
});
