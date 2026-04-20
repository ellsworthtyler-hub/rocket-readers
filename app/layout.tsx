//  FILE: app/layout.tsx
//  =============================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';   // ← we'll create this next

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rocket Reader',
  description: 'Find books with the highest sight-word coverage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}