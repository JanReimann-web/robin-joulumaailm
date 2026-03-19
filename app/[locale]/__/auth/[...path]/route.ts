import { NextRequest } from 'next/server'
import { proxyFirebaseAuthHelperRequest } from '@/lib/firebase/auth-helper-proxy'

export const runtime = 'nodejs'

type LocalizedFirebaseAuthProxyRouteProps = {
  params: {
    locale: string
    path: string[]
  }
}

export async function GET(
  request: NextRequest,
  { params }: LocalizedFirebaseAuthProxyRouteProps
) {
  return proxyFirebaseAuthHelperRequest(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: LocalizedFirebaseAuthProxyRouteProps
) {
  return proxyFirebaseAuthHelperRequest(request, params.path)
}
