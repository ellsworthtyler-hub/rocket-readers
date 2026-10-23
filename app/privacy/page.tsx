import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
  description: 'How Rocket Readers collects, uses, and protects information.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>Who we are</h2>
      <p>
        Rocket Readers (rocketreaders.us) helps parents, homeschoolers, and teachers find and use
        public-domain books for early and English-language readers. This policy explains what we
        collect and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> When an adult signs in with Google, X, or Facebook,
          we receive your email address and name from that provider through our authentication
          service (Supabase Auth). We use it to create and secure your account.
        </li>
        <li>
          <strong>Payment information.</strong> Subscriptions are processed by Stripe. Stripe
          handles your card details; we never see or store your full card number. We keep a
          record of your plan and subscription status.
        </li>
        <li>
          <strong>Usage information.</strong> We collect basic usage and analytics data (such as
          pages visited, device and browser type, and approximate location from your IP address)
          to keep the site working and improve it.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>
        We use information to provide and secure the service, manage subscriptions, answer
        support requests, and understand how the site is used. We do not sell personal
        information.
      </p>

      <h2>Children’s privacy</h2>
      <p>
        Rocket Readers accounts are for parents and teachers. Students do not create accounts;
        they use a shared class code provided by their parent or teacher. We do not knowingly
        collect personal information from children under 13. If you believe a child has given
        us personal information, contact us and we will delete it. We aim to follow the
        Children’s Online Privacy Protection Act (COPPA).
      </p>

      <h2>Service providers</h2>
      <p>
        We rely on trusted providers to run the service, including Supabase (accounts and data),
        Stripe (payments), Vercel (hosting), and Cloudflare (file storage). They process
        information only to provide their services to us.
      </p>

      <h2>Data retention and your choices</h2>
      <p>
        We keep account information while your account is active and as needed for legal or
        accounting purposes. You can ask us to access, correct, or delete your information by
        contacting us.
      </p>

      <h2>Book sources</h2>
      <p>
        Our books come from public-domain sources such as Project Gutenberg. See our{' '}
        <Link href="/terms" className="underline">Terms of Service</Link> for details.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy. We will post the new version on this page with its date.</p>

      <h2>Contact</h2>
      <p>Questions about privacy: [contact email]</p>
    </LegalPage>
  );
}
