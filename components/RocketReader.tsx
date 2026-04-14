// components/RocketReader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface RocketReaderProps {
  html: string;
}

export default function RocketReader({ html }: RocketReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = html;

    // Clean white background + black text for teacher-friendly reading
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#1f2937';
    container.style.padding = '2.5rem';
    container.style.borderRadius = '16px';
    container.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
    container.style.lineHeight = '1.8';

    // Global toggle function used by your rr_publisher.py buttons
    (window as any).toggleFeature = (feature: string) => {
      const elements = container.querySelectorAll(`.${feature}`);
      const isActive = elements.length > 0 && (elements[0] as HTMLElement).classList.contains('highlight-active');

      elements.forEach((el) => {
        (el as HTMLElement).classList.toggle('highlight-active', !isActive);
      });

      const buttons = container.querySelectorAll(`button[onclick*="toggleFeature('${feature}'"], button[data-feature="${feature}"]`);
      buttons.forEach((btn) => {
        (btn as HTMLButtonElement).classList.toggle('active', !isActive);
      });

      console.log(`Toggled ${feature} — now ${!isActive ? 'highlighted' : 'normal'}`);
    };

    // Text size controls
    (window as any).changeTextSize = (delta: number) => {
      const newSize = Math.max(14, Math.min(28, fontSize + delta));
      setFontSize(newSize);
      container.style.fontSize = `${newSize}px`;
      console.log(`Text size changed to ${newSize}px`);
    };

    (window as any).toggleDolch = () => (window as any).toggleFeature('sight-dolch');
    (window as any).toggleFry = () => (window as any).toggleFeature('sight-fry');

    // Initial font size
    container.style.fontSize = `${fontSize}px`;

  }, [html, fontSize]);

  return (
    <div 
      ref={containerRef}
      className="prose max-w-none leading-relaxed"
    />
  );
}