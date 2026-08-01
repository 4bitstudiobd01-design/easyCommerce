import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Standard root domains to ignore from subdomain rewriting
  const rootDomains = ['localhost:3000', 'localhost:3001', 'easycommerce.app', 'www.easycommerce.app'];

  // Extract potential subdomain (e.g. sumon-fashion from sumon-fashion.localhost:3000)
  let subdomain: string | null = null;

  if (hostname.includes('.localhost')) {
    subdomain = hostname.split('.localhost')[0];
  } else if (hostname.includes('.easycommerce.app')) {
    subdomain = hostname.split('.easycommerce.app')[0];
  }

  // If valid subdomain exists and is not www / app / admin
  if (subdomain && !['www', 'app', 'admin', 'api'].includes(subdomain.toLowerCase())) {
    // Prevent double rewriting if path already starts with /store
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
