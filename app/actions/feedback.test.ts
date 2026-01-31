import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFeedback, type FeedbackState } from './feedback';
import { db } from '@/lib/prisma';

// Mock the entire module
vi.mock('@/lib/prisma', () => ({
    db: {
        troubleshootingFeedback: {
            create: vi.fn(),
        },
    },
}));

describe('submitFeedback Server Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const validData: FeedbackState = {
        rating: 5,
        isHelpful: true,
        comments: 'Great session!',
        name: 'John Doe',
        mobile: '1234567890',
        email: 'john@example.com',
    };

    it('should successfully submit valid feedback', async () => {
        (db.troubleshootingFeedback.create as any).mockResolvedValue({ id: 1, ...validData });

        const result = await submitFeedback(validData);

        expect(result).toEqual({ success: true });
        expect(db.troubleshootingFeedback.create).toHaveBeenCalledTimes(1);
        expect(db.troubleshootingFeedback.create).toHaveBeenCalledWith({
            data: {
                rating: 5,
                isHelpful: true,
                comments: 'Great session!',
                name: 'John Doe',
                mobile: '1234567890',
                email: 'john@example.com',
            },
        });
    });

    it('should return error if rating is invalid', async () => {
        const result = await submitFeedback({ ...validData, rating: 6 });
        expect(result).toEqual({ success: false, error: 'Please provide a valid star rating (1-5).' });
        expect(db.troubleshootingFeedback.create).not.toHaveBeenCalled();
    });

    it('should return error if contact details are missing', async () => {
        const result = await submitFeedback({ ...validData, name: '' });
        expect(result).toEqual({ success: false, error: 'Please fill in all contact details.' });
        expect(db.troubleshootingFeedback.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
        (db.troubleshootingFeedback.create as any).mockRejectedValue(new Error('DB Fail'));

        const result = await submitFeedback(validData);

        expect(result).toEqual({ success: false, error: 'Internal server error. Please try again.' });
    });
});
