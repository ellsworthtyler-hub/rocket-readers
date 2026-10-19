import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — Rocket Readers',
  description: 'The terms for using Rocket Readers.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <h2>Who we are</h2>
      <p>
        These terms cover your use of Rocket Readers (rocketreaders.us). By using the site you
        agree to them.
      </p>

      <h2>Accounts</h2>
      <p>
        Accounts are for adults (parents, homeschoolers, and teachers). You are responsible for
        your account and for sharing your class code only with your own students. Students use
        the shared class code and do not create accounts.
      </p>

      <h2>Book content</h2>
      <p>
        Books on Rocket Readers come from public-domain sources such as Project Gutenberg. We
        credit the original source on each book page. Project Gutenberg is a registered
        trademark of the Project Gutenberg Literary Archive Foundation, and Rocket Readers is
        not affiliated with or endorsed by it. Our enhanced editions, statistics, and classroom
        materials are our own work.
      </p>

      <h2>Subscriptions, renewal, and cancellation</h2>
      <ul>
        <li>Paid plans are billed through Stripe at the price shown on our{' '}
          <Link href="/premium" className="underline">Pricing</Link> page when you subscribe.</li>
        <li>Subscriptions renew automatically each month or year until you cancel.</li>
        <li>
          You can cancel any time from your Account page. Cancellation stops future renewals; you
          keep access until the end of the period you already paid for.
        </li>
        <li>Except where the law requires, payments are not refundable.</li>
        <li>We may change prices with advance notice before your next renewal.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        Do not misuse the service, try to get around access controls, or resell our enhanced
        materials. We may suspend accounts that break these terms.
      </p>

      <h2>No warranty</h2>
      <p>
        Rocket Readers is provided “as is” and “as available,” without warranties of any kind.
        Reading statistics are automated estimates and may contain errors. To the extent the law
        allows, we are not liable for indirect or consequential damages arising from your use of
        the service.
      </p>

      <h2>Privacy</h2>
      <p>
        See our <Link href="/privacy" className="underline">Privacy Policy</Link> for how we
        handle information.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. We will post the new version on this page with its date.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: [contact email]</p>
    </LegalPage>
  );
}
