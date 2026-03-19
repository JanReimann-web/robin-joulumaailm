import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

const PUBLIC_FILE = /\.[^/]+$/
const BYPASS_PREFIXES = ['/api', '/_next', '/l']
const RESERVED_ROOT_SEGMENTS = new Set(['pricing', 'login', 'dashboard'])
const CANONICAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? ''
const CANONICAL_SITE_HOST = CANONICAL_SITE_URL
  ? new URL(CANONICAL_SITE_URL).host
  : null

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHost = request.headers.get('host')

  if (
    process.env.VERCEL_ENV === 'production'
    && CANONICAL_SITE_HOST
    && requestHost
    && requestHost !== CANONICAL_SITE_HOST
  ) {
    const canonicalUrl = request.nextUrl.clone()
    const targetUrl = new URL(CANONICAL_SITE_URL)
    canonicalUrl.protocol = targetUrl.protocol
    canonicalUrl.hostname = targetUrl.hostname
    canonicalUrl.port = targetUrl.port
    return NextResponse.redirect(canonicalUrl)
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}/login`
    return NextResponse.redirect(url)
  }

  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  const pathLocale = pathname.split('/')[1]
  if (pathLocale && isLocale(pathLocale)) {
    return NextResponse.next()
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}`
    return NextResponse.redirect(url)
  }

  const pathSegments = pathname.split('/').filter(Boolean)

  if (pathSegments.length === 1) {
    const [segment] = pathSegments

    if (segment && RESERVED_ROOT_SEGMENTS.has(segment)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${defaultLocale}/${segment}`
      return NextResponse.redirect(url)
    }

    if (segment) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/l/${segment}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`

  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/:path*',
}
