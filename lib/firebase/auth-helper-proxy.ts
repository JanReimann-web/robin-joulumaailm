import { NextRequest, NextResponse } from 'next/server'

const FIREBASE_AUTH_HELPER_ORIGIN = 'https://kingid-5582a.firebaseapp.com'

const buildUpstreamUrl = (request: NextRequest, pathSegments: string[]) => {
  const upstreamUrl = new URL(
    `/__/auth/${pathSegments.map(encodeURIComponent).join('/')}`,
    FIREBASE_AUTH_HELPER_ORIGIN
  )
  upstreamUrl.search = request.nextUrl.search
  return upstreamUrl
}

const copyRequestHeaders = (request: NextRequest) => {
  const headers = new Headers()
  const forwardableHeaders = [
    'accept',
    'accept-language',
    'content-type',
    'cookie',
    'origin',
    'referer',
    'user-agent',
  ]

  for (const headerName of forwardableHeaders) {
    const value = request.headers.get(headerName)
    if (value) {
      headers.set(headerName, value)
    }
  }

  return headers
}

const copyResponseHeaders = (response: Response) => {
  const headers = new Headers()

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-length') {
      return
    }

    headers.set(key, value)
  })

  return headers
}

export const proxyFirebaseAuthHelperRequest = async (
  request: NextRequest,
  pathSegments: string[]
) => {
  const upstreamResponse = await fetch(buildUpstreamUrl(request, pathSegments), {
    method: request.method,
    headers: copyRequestHeaders(request),
    body: request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer(),
    redirect: 'manual',
  })

  const responseBody = request.method === 'HEAD'
    ? null
    : await upstreamResponse.arrayBuffer()

  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: copyResponseHeaders(upstreamResponse),
  })
}
