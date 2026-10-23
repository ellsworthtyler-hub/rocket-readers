import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard: top sight-word books',
  description: 'The public-domain books with the highest Dolch and Fry sight-word coverage, ranked by Rocket Readers.',
  alternates: { canonical: '/leaderboard' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
