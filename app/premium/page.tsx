import type { Metadata } from 'next';
import PremiumClient from './PremiumClient';

export const metadata: Metadata = {
  title: 'Pricing: Individual / Family and Teacher plans',
  description:
    'Rocket Readers plans: Individual / Family at $4.99/month or $49.99/year, and Teacher at $24.99/month. Enhanced editions, sight-word highlights, and a student class code.',
  alternates: { canonical: '/premium' },
};

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;
  return <PremiumClient canceled={canceled === 'true'} />;
}
