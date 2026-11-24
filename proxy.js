import { NextResponse } from 'next/server'

export function proxy(request) {
  const hasAuthCode = request.nextUrl.searchParams.has('code')
  if (request.nextUrl.pathname !== '/' || !hasAuthCode) return NextResponse.next()

  const callbackUrl = request.nextUrl.clone()
  callbackUrl.pathname = '/auth/callback'
  return NextResponse.redirect(callbackUrl)
}

export const config = {
  matcher: ['/']
}
