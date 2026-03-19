import { NextRequest } from 'next/server'
import { proxyFirebaseAuthHelperRequest } from '@/lib/firebase/auth-helper-proxy'

export const runtime = 'nodejs'

type RootFirebaseAuthProxyRouteProps = {
  params: {
    path: string[]
  }
}

export async function GET(
  request: NextRequest,
  { params }: RootFirebaseAuthProxyRouteProps
) {
  return proxyFirebaseAuthHelperRequest(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: RootFirebaseAuthProxyRouteProps
) {
  return proxyFirebaseAuthHelperRequest(request, params.path)
}
