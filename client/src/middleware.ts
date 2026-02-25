import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    // In cross-domain deployments (Vercel frontend + Render backend),
    // the JWT cookie is set on the backend domain and is NOT visible here.
    // Client-side auth context handles protection via /api/auth/me calls.
    // This middleware only acts when having definitive knowledge (cookie present).

    // If we CAN see the token and user visits auth pages → redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Let all other requests through — client-side auth handles protection
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
