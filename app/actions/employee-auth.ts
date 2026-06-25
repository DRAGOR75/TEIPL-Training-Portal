'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginEmployee(formData: FormData) {
    const empId = formData.get('empId') as string;
    if (empId) {
        const cookieStore = await cookies();
        cookieStore.set('employee_id', empId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        redirect('/user-hub/dashboard');
    }
}

export async function logoutEmployee() {
    const cookieStore = await cookies();
    cookieStore.delete('employee_id');
    redirect('/user-hub');
}
