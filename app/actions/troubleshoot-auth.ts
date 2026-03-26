'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_COOKIE = 'troubleshoot_auth';
const VALID_USER = 'Training';
const VALID_PASS = 'Training123';

export async function loginTroubleshoot(formData: FormData) {
    const user = formData.get('username') as string;
    const pass = formData.get('password') as string;

    if (user === VALID_USER && pass === VALID_PASS) {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        return { success: true };
    }

    return { error: 'Invalid credentials. Please contact administration.' };
}

export async function logoutTroubleshoot() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);
    redirect('/login');
}
