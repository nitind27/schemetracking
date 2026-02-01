import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const authToken = req.cookies.get('auth_token');
  const isLoginPage = req.nextUrl.pathname === '/signin';
  const isRootPage = req.nextUrl.pathname === '/';
  const isPrivacyPolicyPage = req.nextUrl.pathname === '/privacy_policy';
  const isForgotPasswordPage = req.nextUrl.pathname === '/forgot-password';
  const isResetPasswordPage = req.nextUrl.pathname === '/reset-password';
  const isAuthMeAPI = req.nextUrl.pathname === '/api/auth/me';

  // Allow these pages and API endpoints to be accessed without login
  if (isPrivacyPolicyPage || isForgotPasswordPage || isResetPasswordPage || isAuthMeAPI) {
    return NextResponse.next();
  }

  // If accessing root page without auth token, redirect to login
  if (isRootPage && !authToken) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // If no auth token and not on login page, redirect to login
  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // If has auth token and on login page, redirect to dashboard
  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
matcher: [
  '/',
  '/((?!api|_next/static|_next/image|uploads/presentwork|.*\\.png$|.*\\.svg$).*)'
]

};
