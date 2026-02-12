import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {

            const isLoggedIn = !!auth?.user;
            const role = (auth?.user as any)?.role;
            const isAdminRoute = nextUrl.pathname.startsWith('/admin');

            // Debug logging for production issues
            if (isAdminRoute || nextUrl.pathname === '/login') {
                console.log(`Middleware Check: Path=${nextUrl.pathname}, LoggedIn=${isLoggedIn}, Role=${role}`);
            }

            if (isAdminRoute) {
                if (isLoggedIn && role === 'ADMIN') return true;

                console.log(`Access Denied to ${nextUrl.pathname}. Redirecting to /login. LoggedIn=${isLoggedIn}, Role=${role}`);
                return Response.redirect(new URL('/login', nextUrl));
            }
            return true; // Allow access to other pages
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.role && session.user) {
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
