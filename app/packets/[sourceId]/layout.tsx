import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Classwork packet',
  description: 'Download the Rocket Readers classwork packet for this book.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
