import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Skip static resources and API calls
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isLocalhost = hostname.includes('localhost');
  let subdomain = '';
  
  if (isLocalhost) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0].toLowerCase();
    }
  } else {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      subdomain = parts[0].toLowerCase();
    }
  }

  // If there is an active subdomain, execute the rewrite flow
  if (subdomain && subdomain !== 'www') {
    const token = request.cookies.get('vaani_token')?.value;

    // If no session exists, rewrite to standard root login page with the subdomain parameter
    if (!token) {
      if (url.pathname !== '/') {
        // Redirect to subdomain base path
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('subdomain', subdomain);
        return NextResponse.redirect(redirectUrl);
      }
      url.pathname = '/';
      url.searchParams.set('subdomain', subdomain);
      return NextResponse.rewrite(url);
    }

    // Role-specific routing logic based on subdomain
    if (subdomain === 'citizen') {
      if (url.pathname === '/' || url.pathname === '/citizen') {
        url.pathname = '/citizen';
      } else if (!url.pathname.startsWith('/citizen')) {
        url.pathname = `/citizen${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }

    if (subdomain === 'officer') {
      if (url.pathname === '/' || url.pathname === '/officer') {
        url.pathname = '/officer';
      } else if (!url.pathname.startsWith('/officer')) {
        url.pathname = `/officer${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }

    if (['cm', 'dm', 'dept', 'dashboard'].includes(subdomain)) {
      if (url.pathname === '/' || url.pathname === '/dashboard') {
        url.pathname = '/dashboard';
      } else if (!url.pathname.startsWith('/dashboard')) {
        url.pathname = `/dashboard${url.pathname}`;
      }
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
