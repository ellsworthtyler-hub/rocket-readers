// components/RocketReader.tsx
'use client';
import { useEffect, useRef } from "react";

interface RocketReaderProps {
  html: string;
}

export default function RocketReader({ html }: RocketReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = html;

    // Create a single script with defensive checks
    const script = document.createElement("script");
    script.textContent = `
      // Prevent duplicate declarations
      if (typeof window.activePOS === "undefined") {
        window.activePOS = new Set();
        window.activeDolch = new Set();
      }

      window.togglePOS = function(type) {
        if (window.activePOS.has(type)) {
          window.activePOS.delete(type);
        } else {
          window.activePOS.add(type);
        }
        window.updatePOSHighlights();
      };

      window.toggleDolch = function() {
        if (window.activeDolch.size > 0) {
          window.activeDolch.clear();
        } else {
          window.activeDolch.add("dolch");
        }
        window.updateDolchHighlights();
      };

      window.updatePOSHighlights = function() {
        document.querySelectorAll('.pos').forEach(el => {
          const posType = el.getAttribute('data-pos');
          if (posType && window.activePOS.has(posType)) {
            el.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
          } else {
            el.style.backgroundColor = '';
          }
        });
      };

      window.updateDolchHighlights = function() {
        document.querySelectorAll('.dolch').forEach(el => {
          if (window.activeDolch.size > 0) {
            el.style.backgroundColor = 'rgba(234, 179, 8, 0.3)';
          } else {
            el.style.backgroundColor = '';
          }
        });
      };
    `;

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [html]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-invert max-w-none bg-slate-900 p-8 rounded-3xl border border-white/10"
    />
  );
}
