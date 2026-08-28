import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { isLocale, locales } from '@/i18n/config';
import { PRE_PAINT_THEME_SCRIPT } from '@/lib/theme';
import { tokens } from '@/lib/tokens';
import { AuthProvider } from '@/contexts/auth-context';
import { ActiveOrgProvider } from '@/lib/workspaces/useActiveOrg';
import { CopilotProvider, CopilotDock } from '@/components/copilot';
import '../globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'arroba.com — Plataforma privada de M&A',
  description: 'Analízar · Valorar · Comprar o vender. Agencias digitales y Madtech.',
};

export const viewport: Viewport = {
  themeColor: tokens.brand.black,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_THEME_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            <ActiveOrgProvider>
              <CopilotProvider>
                {children}
                <CopilotDock />
              </CopilotProvider>
            </ActiveOrgProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
