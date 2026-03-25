import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Combined Proxy/Auth Middleware.
 * 
 * This file handles:
 * 1. NextAuth authentication (v5 Beta)
 * 2. Subdomain-based URL rewriting for the Troubleshooting app
 */

const authMiddleware = NextAuth(authConfig).auth;

const TROUBLESHOOT_HOSTNAME = process.env.TROUBLESHOOT_HOSTNAME || 'hemmts.academythriveni.com';

function isTroubleshootHost(host: string | null): boolean {
    if (!host) return false;
    const hostname = host.toLowerCase().split(':')[0];
    // Favor production hostname, but allow 'troubleshoot' prefix for local dev if env is set
    return hostname === 'hemmts.academythriveni.com' || 
           hostname.includes('hemmts') || 
           hostname.startsWith('troubleshoot');
}

export default authMiddleware(async (req) => {
    const host = req.headers.get('host');
    const { pathname } = req.nextUrl;

    // --- Subdomain Routing Logic ---
    if (isTroubleshootHost(host)) {
        // Skip for static assets, API, or if already on a /troubleshoot path
        const isStatic = pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/favicon') ||
            /\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|webmanifest)$/.test(pathname);

        if (!isStatic && !pathname.startsWith('/troubleshoot')) {
            // Block non-troubleshoot app routes on the subdomain
            const blockedPrefixes = ['/admin', '/login', '/trainer', '/join', '/tni'];
            if (blockedPrefixes.some(prefix => pathname.startsWith(prefix))) {
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
});

export const config = {
    // Apply middleware to all routes EXCEPT static files (next internals, etc)
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};