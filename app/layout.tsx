//  FILE: app/layout.tsx
//  =============================

import type { Metadata } from 'next';
import { Fredoka, Nunito, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthProvider } from '@/components/AuthProvider';
import { AttributionCapture } from '@/components/AttributionCapture';
import NavBar from '@/components/NavBar';
import SiteFooter from '@/components/SiteFooter';
import ThemeBody from '@/components/ThemeBody';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, jsonLd } from '@/lib/seo';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['500', '600', '700', '800'],
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['400', '600', '700'],
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Rocket Readers: sight-word books for young readers', template: '%s | Rocket Readers' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_US', url: SITE_URL },
  twitter: { card: 'summary_large_image' },
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} ${sourceSerif.variable}`}>
      <ThemeBody className={nunito.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd) }} />
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
        <AttributionCapture />
        <Analytics />
        <SpeedInsights />
      </ThemeBody>
    </html>
  );
}
