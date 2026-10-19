import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-700 bg-slate-900/90 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Rocket Readers</span>
        <nav className="flex gap-4">
          <Link href="/premium" className="hover:text-emerald-300">Pricing</Link>
          <Link href="/about" className="hover:text-emerald-300">About Us</Link>
          <Link href="/privacy" className="hover:text-emerald-300">Privacy</Link>
          <Link href="/terms" className="hover:text-emerald-300">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
