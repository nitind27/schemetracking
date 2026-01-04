import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const authToken = req.cookies.get('auth_token');
  const isLoginPage = req.nextUrl.pathname === '/signin';
  const isPrivacyPolicyPage = req.nextUrl.pathname === '/privacy_policy';
  const isForgotPasswordPage = req.nextUrl.pathname === '/forgot-password';
  const isResetPasswordPage = req.nextUrl.pathname === '/reset-password';

  // Allow these pages to be accessed without login
  if (isPrivacyPolicyPage || isForgotPasswordPage || isResetPasswordPage) {
    return NextResponse.next();
  }

  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

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
