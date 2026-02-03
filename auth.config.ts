import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            if (process.env.NODE_ENV === 'development') {
                return true;
            }

            const isLoggedIn = !!auth?.user;
            const isAdminRoute = nextUrl.pathname.startsWith('/admin');

            if (isAdminRoute) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login
            }
            return true; // Allow access to other pages
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
