'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/prisma';

export async function loginEmployee(formData: FormData) {
    const empId = formData.get('empId') as string;
    if (empId) {
        const employee = await db.employee.findUnique({
            where: { id: empId }
        });

        if (!employee) {
            return { error: 'You are not registered yet. Please contact the training department.' };
        }

        const cookieStore = await cookies();
        cookieStore.set('employee_id', empId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        
        return { success: true };
    }
}

export async function logoutEmployee() {
    const cookieStore = await cookies();
    cookieStore.delete('employee_id');
    redirect('/user-hub');
}
