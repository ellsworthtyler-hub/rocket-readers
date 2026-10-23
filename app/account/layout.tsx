import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Manage your Rocket Readers plan, billing, and student class code.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
