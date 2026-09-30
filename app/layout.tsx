//  FILE: app/layout.tsx
//  =============================

import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-nunito',
});
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--rr-display',
});

export const metadata: Metadata = {
  title: 'Rocket Readers',
  description: 'Find books with the highest sight-word coverage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.className} ${nunito.variable} ${fredoka.variable}`}>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}