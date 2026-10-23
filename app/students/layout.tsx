import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Students: enter your class code',
  description: 'Students sign in to Rocket Readers with the class code from their parent or teacher.',
  alternates: { canonical: '/students' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
