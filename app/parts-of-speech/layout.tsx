import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search books by part of speech',
  description: 'Find public-domain books by their mix of nouns, verbs, adjectives, and other parts of speech.',
  alternates: { canonical: '/parts-of-speech' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
