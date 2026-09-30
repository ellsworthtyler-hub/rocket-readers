//  FILE: app/layout.tsx
//  =============================

import type { Metadata } from 'next';
import { Fredoka, Nunito, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import ThemeBody from '@/components/ThemeBody';

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
  title: 'Rocket Reader',
  description: 'Find books with the highest sight-word coverage for young readers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} ${sourceSerif.variable}`}>
      <ThemeBody className={nunito.className}>
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </ThemeBody>
    </html>
  );
}
