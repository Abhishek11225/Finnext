import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
    "better-auth-session_token",
    "__Secure-better-auth-session_token",
];

export async function middleware(request: NextRequest) {
    const sessionCookie = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));

    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|forgot-password|reset-password|verify-email|assets).*)',
    ],
};
