'use client';

import { usePathname } from 'next/navigation';
import { isCalmPath } from '@/lib/theme';

export default function ThemeBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const calm = isCalmPath(pathname);

  return (
    <body
      className={`${className} ${calm ? 'theme-calm' : 'theme-cosmic'} antialiased`}
      data-theme={calm ? 'calm' : 'cosmic'}
    >
      {!calm && <div className="cosmic-stars" aria-hidden />}
      <div className="relative z-[1] min-h-screen flex flex-col">{children}</div>
    </body>
  );
}
