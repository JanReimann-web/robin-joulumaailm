import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

const PUBLIC_FILE = /\.[^/]+$/
const BYPASS_PREFIXES = ['/api', '/_next', '/l']
const RESERVED_ROOT_SEGMENTS = new Set(['pricing', 'login', 'dashboard'])
const SENSITIVE_POST_API_PATTERNS = [
  /^\/api\/leads$/,
  /^\/api\/public-list\/[^/]+\/unlock$/,
  /^\/api\/public-list\/[^/]+\/reserve$/,
  /^\/api\/public-list\/[^/]+\/reservation-details$/,
]
const getCanonicalSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? ''
const getCanonicalSiteHost = () => {
  const canonicalSiteUrl = getCanonicalSiteUrl()
  return canonicalSiteUrl
    ? new URL(canonicalSiteUrl).host
    : null
}

const isSensitivePostApiRequest = (request: NextRequest) => {
  if (request.method !== 'POST') {
    return false
  }

  return SENSITIVE_POST_API_PATTERNS.some((pattern) => pattern.test(request.nextUrl.pathname))
}

const normalizeHost = (value: string | null) => {
  if (!value) {
    return null
  }

  return value.trim().toLowerCase()
}

const extractHeaderHost = (value: string | null) => {
  if (!value) {
    return null
  }

  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

const isTrustedSameOriginMutation = (request: NextRequest) => {
  const requestHost = normalizeHost(request.headers.get('host'))
  const canonicalHost = normalizeHost(getCanonicalSiteHost())
  const allowedHosts = new Set(
    [requestHost, canonicalHost]
      .filter((host): host is string => Boolean(host))
  )

  const secFetchSite = request.headers.get('sec-fetch-site')?.trim().toLowerCase()
  if (secFetchSite && ['cross-site', 'same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    return secFetchSite !== 'cross-site'
  }

  const originHost = extractHeaderHost(request.headers.get('origin'))
  if (originHost) {
    return allowedHosts.has(originHost)
  }

  const refererHost = extractHeaderHost(request.headers.get('referer'))
  if (refererHost) {
    return allowedHosts.has(refererHost)
  }

  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHost = request.headers.get('host')
  const canonicalSiteUrl = getCanonicalSiteUrl()
  const canonicalSiteHost = getCanonicalSiteHost()

  if (
    isSensitivePostApiRequest(request)
    && !isTrustedSameOriginMutation(request)
  ) {
    return NextResponse.json(
      { error: 'forbidden_origin' },
      { status: 403 }
    )
  }

  if (
    process.env.VERCEL_ENV === 'production'
    && canonicalSiteHost
    && requestHost
    && requestHost !== canonicalSiteHost
  ) {
    const canonicalUrl = request.nextUrl.clone()
    const targetUrl = new URL(canonicalSiteUrl)
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
