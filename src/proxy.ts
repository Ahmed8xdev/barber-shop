import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { preferredLocale } from './lib/locale';

const locales = ['en', 'ar'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname has a supported locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  const locale = preferredLocale(request.headers.get('accept-language'));
  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}${pathname}`;
  const redirect = NextResponse.redirect(destination);
  redirect.headers.set('Vary', 'Accept-Language');
  return redirect;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api) and static public folder assets (e.g. svg, png, webp, ico)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|mp4|json|xml)).*)',
  ],
};
