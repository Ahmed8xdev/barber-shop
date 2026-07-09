import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ar'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname has a supported locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Check browser language preferences
  const acceptLanguage = request.headers.get('accept-language');
  let locale = defaultLocale;
  
  if (acceptLanguage) {
    if (acceptLanguage.startsWith('ar') || acceptLanguage.includes(',ar')) {
      locale = 'ar';
    }
  }

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api) and static public folder assets (e.g. svg, png, webp, ico)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|mp4|json|xml)).*)',
  ],
};
