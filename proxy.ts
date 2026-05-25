import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from 'next/server';
import type { NextRequest, NextProxy, ProxyConfig } from 'next/server';

/**
 * Combined Proxy/Auth Middleware (Now renamed to Proxy in Next.js 16).
 * 
 * This file handles:
 * 1. NextAuth authentication (v5 Beta)
 * 2. Subdomain-based URL rewriting for the Troubleshooting app
 */

const authProxy = NextAuth(authConfig).auth;

const TROUBLESHOOT_HOSTNAME = process.env.TROUBLESHOOT_HOSTNAME || 'hemmts.academythriveni.com';

function isTroubleshootHost(host: string | null): boolean {
    if (!host) return false;
    const hostname = host.toLowerCase().split(':')[0];
    // Favor production hostname, but allow 'troubleshoot' prefix for local dev if env is set
    return hostname === 'hemmts.academythriveni.com' || 
           hostname.includes('hemmts') || 
           hostname.startsWith('troubleshoot');
}

export default authProxy(async (req) => {
    const host = req.headers.get('host');
    const { pathname } = req.nextUrl;

    // --- Subdomain Routing Logic ---
    if (isTroubleshootHost(host)) {
        const isAuth = req.cookies.get('troubleshoot_auth')?.value === 'true';

        // Skip for static assets, API, or if already on a /troubleshoot path
        const isStatic = pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/favicon') ||
            /\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|webmanifest)$/.test(pathname);

        // Redirect to login if not authenticated
        if (!isAuth && !pathname.startsWith('/login') && !isStatic && !pathname.startsWith('/api')) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        if (!isStatic && !pathname.startsWith('/troubleshoot')) {
            // Block non-troubleshoot app routes on the subdomain
            const blockedPrefixes = ['/admin', '/login', '/trainer', '/join', '/tni'];
            // EXCEPT /login which we need for auth flow
            if (blockedPrefixes.some(prefix => pathname.startsWith(prefix) && prefix !== '/login')) {
                const url = req.nextUrl.clone();
                url.pathname = '/';
                return NextResponse.redirect(url);
            }

            // Rewrite root and sub-paths to /troubleshoot/*
            const url = req.nextUrl.clone();
            url.pathname = `/troubleshoot${pathname === '/' ? '' : pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    // Default: Continue to auth (NextAuth's auth() already happens via the wrapper)
    return NextResponse.next();
}) as unknown as NextProxy;

export const config: ProxyConfig = {
    // Apply proxy to all routes EXCEPT static files and API routes
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
