import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const supportedLocales = ['en', 'zh'] as const
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') || ''

  // Parse accept-language: "zh-CN,zh;q=0.9,en;q=0.8"
  const parsed = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, qRaw] = part.split(';q=')
      return { tag: tag.trim().split('-')[0], q: qRaw ? parseFloat(qRaw) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of parsed) {
    if ((supportedLocales as readonly string[]).includes(tag)) {
      return tag
    }
  }

  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const pathnameHasLocale = (supportedLocales as readonly string[]).some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
