// FILE: components/ui/SourceIcon.tsx
// Small original source icons (evocative, not copies of any trademarked logo).
// Same artwork as public/icons/sources/*.svg (24x24 viewBox).
import { sourceInfo, type BookSource } from '@/lib/bookSources';

const BOOK_L = 'M4 8.2c2.6-.9 5.2-.6 7.4.9v9.4c-2.2-1.4-4.8-1.7-7.4-.9z';
const BOOK_R = 'M20 8.2c-2.6-.9-5.2-.6-7.4.9v9.4c2.2-1.4 4.8-1.7 7.4-.9z';

function Art({ source }: { source: BookSource }) {
  switch (source) {
    case 'gutenberg_au':
      return (
        <>
          <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#065F46" />
          <path d={BOOK_L} fill="#FFFFFF" />
          <path d={BOOK_R} fill="#FFFFFF" />
          <g fill="#F59E0B">
            <circle cx="16.6" cy="10.9" r="0.95" />
            <circle cx="18.4" cy="13.2" r="0.8" />
            <circle cx="16.3" cy="15.9" r="1.05" />
            <circle cx="14.7" cy="13.4" r="0.75" />
          </g>
          <path d="M12 2.2l.86 1.86 2.02-.4-.98 1.8 1.6 1.28-2.03.3.08 2.05L12 7.6l-1.55 1.49.08-2.05-2.03-.3 1.6-1.28-.98-1.8 2.02.4z" fill="#FBBF24" />
        </>
      );
    case 'wikisource':
      return (
        <>
          <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#0E7490" />
          <path d="M3.6 7.4c2.7-1 5.4-.7 7.7.9v10.2c-2.3-1.5-5-1.9-7.7-.9z" fill="#FFFFFF" />
          <path d="M20.4 7.4c-2.7-1-5.4-.7-7.7.9v10.2c2.3-1.5 5-1.9 7.7-.9z" fill="#FFFFFF" />
          <path d="M5.3 10.4c1.5-.4 3-.3 4.4.3M5.3 12.8c1.5-.4 3-.3 4.4.3M5.3 15.2c1.5-.4 3-.3 4.4.3" stroke="#0E7490" strokeWidth="1" strokeLinecap="round" fill="none" />
          <g fill="#0E7490">
            <rect x="13.9" y="11.6" width="4.2" height="4.2" rx="0.5" />
            <circle cx="16" cy="11.3" r="1.05" />
            <circle cx="18.4" cy="13.7" r="1.05" />
          </g>
          <circle cx="14.1" cy="13.7" r="0.9" fill="#FFFFFF" />
        </>
      );
    case 'wikibooks':
      return (
        <>
          <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#B45309" />
          <rect x="4" y="15.6" width="16" height="4" rx="1" fill="#FFFFFF" />
          <g transform="rotate(-4 12.4 12.8)">
            <rect x="5.6" y="10.8" width="13.6" height="4" rx="1" fill="#FDE68A" />
            <path d="M8.2 11.1v4M16.4 10.6v4" stroke="#B45309" strokeWidth="1" />
          </g>
          <g transform="rotate(3 11.2 8)">
            <rect x="5" y="6" width="12.4" height="4" rx="1" fill="#FFFFFF" />
            <path d="M7.6 6v4M15 6v4" stroke="#B45309" strokeWidth="1" />
          </g>
          <path d="M7 15.6v4M17 15.6v4" stroke="#B45309" strokeWidth="1" />
        </>
      );
    default:
      return (
        <>
          <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#1E3A8A" />
          <path d={BOOK_L} fill="#FFFFFF" />
          <path d={BOOK_R} fill="#FFFFFF" />
          <path d="M13.8 11.2c1.8-.8 3.6-.9 5-.5M13.8 13.6c1.8-.8 3.6-.9 5-.5M13.8 16c1.8-.8 3.6-.9 5-.5" stroke="#DC2626" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <path d="M12 2.4l1.03 2.1 2.32.34-1.68 1.63.4 2.3L12 7.68 9.93 8.77l.4-2.3-1.68-1.63 2.32-.34z" fill="#FFFFFF" />
        </>
      );
  }
}

export function SourceIcon({
  source,
  size = 20,
  className,
}: {
  source: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const info = sourceInfo(source);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={`Source: ${info.label}`}
      className={className}
    >
      <title>{`Source: ${info.label} · ${info.licenseLine}`}</title>
      <Art source={info.source} />
    </svg>
  );
}

/** Icon + visible label pill, for the book stats page. */
export function SourceBadge({ source }: { source: string | null | undefined }) {
  const info = sourceInfo(source);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm font-bold text-slate-100"
      title={info.licenseLine}
    >
      <SourceIcon source={info.source} size={20} />
      <span>Source: {info.label}</span>
    </span>
  );
}
