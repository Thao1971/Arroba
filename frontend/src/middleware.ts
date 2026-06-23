import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n/config';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'never',
  localeDetection: true,
});

export const config = {
  // Skip API, _next, static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
