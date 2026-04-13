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

    // Force clean white reading background + black text
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#1f2937';
    container.style.padding = '2.5rem';
    container.style.borderRadius = '16px';
    container.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';

    // Make toggle functions available globally for rr_publisher.py buttons
    (window as any).toggleFeature = (feature: string) => {
      const isActive = container.querySelectorAll(`.${feature}.highlight-active`).length > 0;

      // Toggle highlight class on all matching elements
      const elements = container.querySelectorAll(`.${feature}`);
      elements.forEach((el) => {
        (el as HTMLElement).classList.toggle('highlight-active', !isActive);
      });

      // Toggle active state on buttons
      const buttons = container.querySelectorAll(`button[data-feature="${feature}"], button[onclick*="toggleFeature('${feature}'"]`);
      buttons.forEach((btn) => {
        (btn as HTMLButtonElement).classList.toggle('active', !isActive);
      });

      console.log(`Toggled ${feature} — now ${!isActive ? 'highlighted' : 'normal'}`);
    };

    // Expose common shortcuts
    (window as any).toggleDolch = () => (window as any).toggleFeature('sight-dolch');
    (window as any).toggleFry = () => (window as any).toggleFeature('sight-fry');

    // Add click handlers for any data-feature buttons
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
      className="prose max-w-none leading-relaxed"
      style={{ 
        fontSize: 'var(--reader-font-size, 18px)',
        lineHeight: '1.75'
      }}
    />
  );
}