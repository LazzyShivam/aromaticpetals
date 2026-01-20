import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin/')
  const isCustomerAppPath =
    pathname === '/products' ||
    pathname.startsWith('/products/') ||
    pathname === '/product' ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname === '/profile'

  if (!isAdminPath && !isAdminApi && !isCustomerAppPath) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (token && (token as any).role === 'admin' && isCustomerAppPath) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if ((token as any).role !== 'admin') {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/products/:path*', '/product', '/cart', '/checkout', '/profile'],
}
