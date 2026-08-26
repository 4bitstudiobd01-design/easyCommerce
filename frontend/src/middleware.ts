import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Subdomain Wildcard Routing Rewrite (e.g. sumon-fashion.localhost:3000 -> /store/sumon-fashion)
  let subdomain: string | null = null;

  if (hostname.includes('.localhost')) {
    subdomain = hostname.split('.localhost')[0];
  } else if (hostname.includes('.bitcommerce.app')) {
    subdomain = hostname.split('.bitcommerce.app')[0];
  }

  // If valid subdomain exists and is not www / app / admin / api
  if (subdomain && !['www', 'app', 'admin', 'api'].includes(subdomain.toLowerCase())) {
    if (!url.pathname.startsWith('/store/')) {
      return NextResponse.rewrite(new URL(`/store/${subdomain}${url.pathname}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
