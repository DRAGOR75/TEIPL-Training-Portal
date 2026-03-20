import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for subdomain-based routing.
 * 
 * When a request comes from the troubleshooting subdomain (hemmts.academythriveni.com),
 * it rewrites URLs so the troubleshooting app is served at the root:
 *   - `/` → `/troubleshoot`
 *   - `/feedback` → `/troubleshoot/feedback`
 *   - `/123` → `/troubleshoot/123`
 * 
 * Requests to non-troubleshoot paths (e.g., `/admin`, `/login`) on the subdomain
 * are redirected back to `/`.
 * 
 * On the main domain, everything behaves normally.
 */

const TROUBLESHOOT_HOSTNAME = process.env.TROUBLESHOOT_HOSTNAME || 'hemmts.academythriveni.com';

function isTroubleshootHost(host: string): boolean {
    // Strip port for comparison (important for local dev)
    const hostname = host.split(':')[0];
    const expected = TROUBLESHOOT_HOSTNAME.split(':')[0];
    return hostname === expected;
}

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';

    // Only apply subdomain logic for the troubleshooting hostname
    if (!isTroubleshootHost(host)) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // Already on a /troubleshoot path — let it through as-is
    if (pathname.startsWith('/troubleshoot')) {
        return NextResponse.next();
    }

    // Allow static assets, API routes, Next.js internals, and auth routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf)$/)
    ) {
        return NextResponse.next();
    }

    // Block non-troubleshoot app routes on the subdomain (e.g., /admin, /login, /trainer)
    const blockedPrefixes = ['/admin', '/login', '/trainer', '/join', '/tni'];
    if (blockedPrefixes.some(prefix => pathname.startsWith(prefix))) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // Rewrite root and sub-paths to /troubleshoot/*
    // e.g., `/` → `/troubleshoot`, `/feedback` → `/troubleshoot/feedback`, `/123` → `/troubleshoot/123`
    const url = request.nextUrl.clone();
    url.pathname = `/troubleshoot${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
}

export const config = {
    // Run middleware on all paths except static files and Next.js internals
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
