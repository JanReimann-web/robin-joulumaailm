import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import {
  createPublicAccessToken,
  getPublicAccessCookieName,
  isValidVisibilityPassword,
  verifyVisibilityPassword,
} from '@/lib/lists/password.server'
import { getPublicListBySlug } from '@/lib/lists/public-server'

export const runtime = 'nodejs'

type UnlockBody = {
  password?: string
}

type RouteContext = {
  params: {
    slug: string
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const list = await getPublicListBySlug(context.params.slug)
  if (!list || list.accessStatus === 'expired') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (list.visibility !== 'public_password') {
    return NextResponse.json({ ok: true })
  }

  let body: UnlockBody
  try {
    body = (await request.json()) as UnlockBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const password = body.password?.trim() ?? ''
  if (!isValidVisibilityPassword(password)) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 400 })
  }

  const secretSnap = await adminDb.collection('listAccessSecrets').doc(list.id).get()
  const secretData = secretSnap.data() as
    | { passwordSalt?: string; passwordHash?: string }
    | undefined

  const passwordSalt = secretData?.passwordSalt
  const passwordHash = secretData?.passwordHash

  if (
    typeof passwordSalt !== 'string'
    || typeof passwordHash !== 'string'
    || !verifyVisibilityPassword({
      password,
      salt: passwordSalt,
      hash: passwordHash,
    })
  ) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 })
  }

  const cookieName = getPublicAccessCookieName(list.slug)
  const token = createPublicAccessToken({
    listId: list.id,
    slug: list.slug,
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}

