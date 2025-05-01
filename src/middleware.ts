import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {

  const authToken = req.cookies.get('auth_token');
  const isLoginPage = req.nextUrl.pathname === '/signin';


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
      '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)' // Added .svg exclusion
    ]
  };
  