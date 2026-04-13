// components/RocketReader.tsx
'use client';

import { useEffect, useRef } from 'react';

interface RocketReaderProps {
  html: string;
}

export default function RocketReader({ html }: RocketReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = html;

    // Make toggle functions available globally for the inline onclick handlers from rr_publisher.py
    (window as any).toggleFeature = (feature: string) => {
      const buttons = container.querySelectorAll(`button[onclick*="toggleFeature('${feature}'"]`);
      const isActive = buttons.length > 0 && (buttons[0] as HTMLButtonElement).classList.contains('active');

      // Toggle all buttons for this feature
      buttons.forEach((btn) => {
        (btn as HTMLButtonElement).classList.toggle('active', !isActive);
      });

      // Toggle the actual highlights
      const elements = container.querySelectorAll(`.${feature}`);
      elements.forEach((el) => {
        (el as HTMLElement).classList.toggle('highlight-active', !isActive);
      });

      console.log(`Toggled ${feature} — now ${!isActive ? 'active' : 'inactive'}`);
    };

    // Also expose individual toggles if needed
    (window as any).toggleDolch = () => (window as any).toggleFeature('sight-dolch');
    (window as any).toggleFry = () => (window as any).toggleFeature('sight-fry');
    (window as any).togglePOS = (pos: string) => (window as any).toggleFeature(`pos-${pos.toLowerCase()}`);

    // Add click handlers for any buttons that might use data attributes (future-proof)
    container.querySelectorAll('button[data-feature]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const feature = (btn as HTMLButtonElement).dataset.feature;
        if (feature) (window as any).toggleFeature(feature);
      });
    });

  }, [html]);

  return (
    <div 
      ref={containerRef}
      className="prose max-w-none bg-slate-900 p-8 rounded-3xl border border-white/10 text-slate-100 leading-relaxed"
      style={{ fontSize: 'var(--reader-font-size, 18px)' }}
    />
  );
}