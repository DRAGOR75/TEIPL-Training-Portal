'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type FeedbackState = {
    rating: number;
    isHelpful: boolean | null;
    comments: string;
    name: string;
    mobile: string;
    email: string;
};

export async function submitFeedback(data: FeedbackState) {
    // 1. Basic Validation
    if (!data.rating || data.rating < 1 || data.rating > 5) {
        return { success: false, error: 'Please provide a valid star rating (1-5).' };
    }
    if (data.isHelpful === null) {
        return { success: false, error: 'Please select if the information was useful.' };
    }
    if (!data.name || !data.mobile) {
        return { success: false, error: 'Please fill in all contact details.' };
    }

    try {
        // 2. Save to Database
        await db.troubleshootingFeedback.create({
            data: {
                rating: data.rating,
                isHelpful: data.isHelpful,
                comments: data.comments,
                name: data.name,
                mobile: data.mobile,
                email: data.email,
            },
        });

        // 3. Return Success
        return { success: true };
    } catch (error) {
        console.error('Failed to submit feedback:', error);
        return { success: false, error: 'Internal server error. Please try again.' };
    }
}
